import * as THREE from 'three';

// Map of SMPL AI Joint Names -> Reallusion CC_Base Joint Names
export const SMPL_TO_CC_BASE_MAP: Record<string, string> = {
  // Root & Spine
  'Pelvis': 'CC_Base_Hip',
  'Hips': 'CC_Base_Hip',
  'Spine1': 'CC_Base_Spine01',
  'Spine2': 'CC_Base_Spine02',
  'Spine3': 'CC_Base_Spine02',
  'Neck': 'CC_Base_NeckTwist01',
  'Head': 'CC_Base_Head',
  
  // Left Arm
  'L_Collar': 'CC_Base_L_Clavicle',
  'L_Shoulder': 'CC_Base_L_Upperarm',
  'LeftShoulder': 'CC_Base_L_Upperarm',
  'L_Arm': 'CC_Base_L_Upperarm',
  'LeftArm': 'CC_Base_L_Upperarm',
  'L_Elbow': 'CC_Base_L_Forearm',
  'LeftElbow': 'CC_Base_L_Forearm',
  'L_Wrist': 'CC_Base_L_Hand',
  'LeftWrist': 'CC_Base_L_Hand',

  // Right Arm
  'R_Collar': 'CC_Base_R_Clavicle',
  'R_Shoulder': 'CC_Base_R_Upperarm',
  'RightShoulder': 'CC_Base_R_Upperarm',
  'R_Arm': 'CC_Base_R_Upperarm',
  'RightArm': 'CC_Base_R_Upperarm',
  'R_Elbow': 'CC_Base_R_Forearm',
  'RightElbow': 'CC_Base_R_Forearm',
  'R_Wrist': 'CC_Base_R_Hand',
  'RightWrist': 'CC_Base_R_Hand',

  // Left Leg
  'L_Hip': 'CC_Base_L_Thigh',
  'LeftHip': 'CC_Base_L_Thigh',
  'L_UpLeg': 'CC_Base_L_Thigh',
  'LeftUpLeg': 'CC_Base_L_Thigh',
  'L_Knee': 'CC_Base_L_Calf',
  'LeftKnee': 'CC_Base_L_Calf',
  'L_Ankle': 'CC_Base_L_Foot',
  'L_Foot': 'CC_Base_L_Foot',
  'LeftFoot': 'CC_Base_L_Foot',

  // Right Leg
  'R_Hip': 'CC_Base_R_Thigh',
  'RightHip': 'CC_Base_R_Thigh',
  'R_UpLeg': 'CC_Base_R_Thigh',
  'RightUpLeg': 'CC_Base_R_Thigh',
  'R_Knee': 'CC_Base_R_Calf',
  'RightKnee': 'CC_Base_R_Calf',
  'R_Ankle': 'CC_Base_R_Foot',
  'R_Foot': 'CC_Base_R_Foot',
  'RightFoot': 'CC_Base_R_Foot',
};

// Bones that need axis correction (arm chain)
// SMPL and CC_Base have different local axis conventions for arms.
// Conjugating delta with 180° around X (negate Y,Z) reverses swing direction
// while preserving twist. This fixes "arms going backwards" issue.
const ARM_BONES = new Set([
  'CC_Base_L_Clavicle', 'CC_Base_R_Clavicle',
  'CC_Base_L_Upperarm', 'CC_Base_R_Upperarm',
  'CC_Base_L_Forearm', 'CC_Base_R_Forearm',
  'CC_Base_L_Hand', 'CC_Base_R_Hand',
]);

/**
 * Pure relative-delta retargeting engine with axis correction for arms.
 * 
 * Math:
 *   For each animation frame quaternion q_anim on bone B_src:
 *     delta = inverse(q_rest_src) * q_anim     (relative motion from source rest)
 *     
 *     For legs/spine/head (aligned axes):
 *       q_final = q_rest_tgt * delta
 *     
 *     For arms (misaligned axes):
 *       delta_corrected = conjugate_180X(delta)  // negate Y,Z to flip swing direction
 *       q_final = q_rest_tgt * delta_corrected
 */
export function buildRetargetedClip(
  sourceFbx: THREE.Group,
  targetGltf: THREE.Group,
  clip: THREE.AnimationClip,
  clipName = 'RetargetedAIClip'
): THREE.AnimationClip {
  // 1. Capture Target GLB Rest Rotations (before any animation)
  const targetRestQuats: Record<string, THREE.Quaternion> = {};
  targetGltf.traverse((child) => {
    if (child.name) {
      targetRestQuats[child.name] = child.quaternion.clone();
    }
  });

  // 2. Capture Source FBX Rest Rotations (bind pose from FBXLoader)
  const sourceRestQuats: Record<string, THREE.Quaternion> = {};
  sourceFbx.traverse((child) => {
    if (child.name) {
      sourceRestQuats[child.name] = child.quaternion.clone();
    }
  });

  // 3. Log diagnostic info for first build
  const loggedBones = new Set<string>();

  const retargetedTracks: THREE.KeyframeTrack[] = [];

  clip.tracks.forEach((track) => {
    const dotIdx = track.name.indexOf('.');
    const trackBoneName = track.name.substring(0, dotIdx);
    const trackProperty = track.name.substring(dotIdx + 1);
    const isQuaternion = track instanceof THREE.QuaternionKeyframeTrack;

    // Find the BEST matching mapped bone name
    // Use exact match first, then substring match
    let mappedTargetBone = '';
    
    // Try exact match first
    if (SMPL_TO_CC_BASE_MAP[trackBoneName]) {
      mappedTargetBone = SMPL_TO_CC_BASE_MAP[trackBoneName];
    } else {
      // Substring match (for names like "mixamorig:L_Hip")
      for (const [smplName, ccName] of Object.entries(SMPL_TO_CC_BASE_MAP)) {
        if (trackBoneName.toLowerCase().includes(smplName.toLowerCase())) {
          mappedTargetBone = ccName;
          break;
        }
      }
    }

    if (!mappedTargetBone) {
      return; // Skip unmapped joints
    }

    // CRITICAL FIX: Ignore ALL position tracks by default (including root/pelvis).
    // Raw FBX position tracks carry absolute spatial translations in SMPL coordinates/scale.
    // Applying raw position tracks overwrites Rattle's rest position (Z=45.69) or teleports
    // the character across the scene.
    // In-place rotation retargeting keeps the character centered and rock-solid.
    if (trackProperty === 'position') {
      return;
    }

    if (isQuaternion) {
      const sourceRest = sourceRestQuats[trackBoneName] || new THREE.Quaternion();
      const targetRest = targetRestQuats[mappedTargetBone] || new THREE.Quaternion();

      // Log once per bone for diagnostics
      if (!loggedBones.has(trackBoneName)) {
        loggedBones.add(trackBoneName);
        console.log(`[Retarget] ${trackBoneName} -> ${mappedTargetBone}`);
        console.log(`  srcRest: (${sourceRest.x.toFixed(4)}, ${sourceRest.y.toFixed(4)}, ${sourceRest.z.toFixed(4)}, ${sourceRest.w.toFixed(4)})`);
        console.log(`  tgtRest: (${targetRest.x.toFixed(4)}, ${targetRest.y.toFixed(4)}, ${targetRest.z.toFixed(4)}, ${targetRest.w.toFixed(4)})`);
      }

      const sourceRestInv = sourceRest.clone().invert();
      const times = track.times;
      const values = new Float32Array(track.values);

      for (let i = 0; i < values.length; i += 4) {
        const qAnim = new THREE.Quaternion(values[i], values[i + 1], values[i + 2], values[i + 3]);
        
        // Pure relative delta: remove source rest, get motion only
        const deltaQ = sourceRestInv.clone().multiply(qAnim);

        // 1. LEG SWING CORRECTION: Reverse leg pitch so steps go FORWARD.
        if (mappedTargetBone.includes('Thigh') || mappedTargetBone.includes('Calf') || mappedTargetBone.includes('Foot')) {
          deltaQ.x = -deltaQ.x;
          deltaQ.y = -deltaQ.y;
        }

        // 2. ARM POSTURE CORRECTION:
        // SMPL rest pose has arms sticking straight OUT horizontally (T-Pose).
        // Without an offset, applying the AI walk delta keeps the arms elevated at 90° in the air.
        // We apply a drop offset (-75° Z for Left, +75° Z for Right) to drop arms down to the sides naturally.
        if (mappedTargetBone === 'CC_Base_L_Upperarm') {
          const armDropQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.42);
          deltaQ.premultiply(armDropQuat);
        } else if (mappedTargetBone === 'CC_Base_R_Upperarm') {
          const armDropQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * 0.42);
          deltaQ.premultiply(armDropQuat);
        }

        // Apply motion delta on top of target rest pose
        const qFinal = targetRest.clone().multiply(deltaQ);

        values[i] = qFinal.x;
        values[i + 1] = qFinal.y;
        values[i + 2] = qFinal.z;
        values[i + 3] = qFinal.w;
      }

      const newTrackName = `${mappedTargetBone}.quaternion`;
      retargetedTracks.push(new THREE.QuaternionKeyframeTrack(newTrackName, times, values));
    }
  });

  console.log(`[Retarget] Built clip "${clipName}" with ${retargetedTracks.length} tracks, duration ${clip.duration.toFixed(2)}s`);
  return new THREE.AnimationClip(clipName, clip.duration, retargetedTracks);
}

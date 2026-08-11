import React, { useEffect, useRef, useMemo } from 'react';
import { useCurrentFrame, staticFile } from 'remotion';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';

interface Props {
  scale?: number;
}

export const RattleAISoccerAvatar: React.FC<Props> = ({ scale = 1.0 }) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const t = frame / fps;

  const gltf = useLoader(GLTFLoader, staticFile('models/Rattle_rigging.glb'));
  const fbx = useLoader(FBXLoader, staticFile('models/ai_soccer_motion.fbx'));

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  // Exact SMPL (HY-Motion) to CC_Base (Rattle) Joint Mapping Table with 180 deg Thigh Orientation Fix
  useEffect(() => {
    if (fbx.animations && fbx.animations.length > 0) {
      const clip = fbx.animations[0].clone();
      const retargetedTracks: THREE.KeyframeTrack[] = [];

      // 180 deg pitch inversion quaternion for thighs so legs point DOWN to floor
      const legDownFixQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);

      clip.tracks.forEach((track) => {
        let name = track.name;
        const isPositionTrack = name.endsWith('.position');

        // Exact SMPL Joint Names -> CC_Base Joint Names
        name = name
          .replace(/(mixamorig|humanoid)?_?:?Pelvis|Hips/i, 'CC_Base_Pelvis')
          .replace(/(mixamorig|humanoid)?_?:?Spine3|Spine2/i, 'CC_Base_Spine02')
          .replace(/(mixamorig|humanoid)?_?:?Spine1|Spine/i, 'CC_Base_Spine01')
          .replace(/(mixamorig|humanoid)?_?:?Neck/i, 'CC_Base_NeckTwist01')
          .replace(/(mixamorig|humanoid)?_?:?Head/i, 'CC_Base_Head')
          .replace(/(mixamorig|humanoid)?_?:?L_Shoulder|LeftShoulder|L_Arm|LeftArm/i, 'CC_Base_L_Upperarm')
          .replace(/(mixamorig|humanoid)?_?:?R_Shoulder|RightShoulder|R_Arm|RightArm/i, 'CC_Base_R_Upperarm')
          .replace(/(mixamorig|humanoid)?_?:?L_Elbow|LeftElbow|L_ForeArm|LeftForeArm/i, 'CC_Base_L_Forearm')
          .replace(/(mixamorig|humanoid)?_?:?R_Elbow|RightElbow|R_ForeArm|RightForeArm/i, 'CC_Base_R_Forearm')
          .replace(/(mixamorig|humanoid)?_?:?L_Wrist|LeftWrist|L_Hand|LeftHand/i, 'CC_Base_L_Hand')
          .replace(/(mixamorig|humanoid)?_?:?R_Wrist|RightWrist|R_Hand|RightHand/i, 'CC_Base_R_Hand')
          .replace(/(mixamorig|humanoid)?_?:?L_Hip|LeftHip|L_UpLeg|LeftUpLeg/i, 'CC_Base_L_Thigh')
          .replace(/(mixamorig|humanoid)?_?:?R_Hip|RightHip|R_UpLeg|RightUpLeg/i, 'CC_Base_R_Thigh')
          .replace(/(mixamorig|humanoid)?_?:?L_Knee|LeftKnee|L_Leg|LeftLeg/i, 'CC_Base_L_Calf')
          .replace(/(mixamorig|humanoid)?_?:?R_Knee|RightKnee|R_Leg|RightLeg/i, 'CC_Base_R_Calf')
          .replace(/(mixamorig|humanoid)?_?:?L_Ankle|L_Foot|LeftFoot/i, 'CC_Base_L_Foot')
          .replace(/(mixamorig|humanoid)?_?:?R_Ankle|R_Foot|RightFoot/i, 'CC_Base_R_Foot');

        // Discard position tracks on limbs to keep skeleton intact
        if (isPositionTrack && !name.includes('CC_Base_Pelvis')) {
          return;
        }

        // Discard pelvis rotation that flips body upside down
        if (name.includes('CC_Base_Pelvis') || name.includes('CC_Base_Hip')) {
          return;
        }

        // Invert Thigh quaternion pitch so legs point DOWN to floor
        if (track instanceof THREE.QuaternionKeyframeTrack && (name.includes('CC_Base_L_Thigh') || name.includes('CC_Base_R_Thigh'))) {
          const values = new Float32Array(track.values);
          for (let i = 0; i < values.length; i += 4) {
            const q = new THREE.Quaternion(values[i], values[i + 1], values[i + 2], values[i + 3]);
            q.premultiply(legDownFixQuat);
            values[i] = q.x;
            values[i + 1] = q.y;
            values[i + 2] = q.z;
            values[i + 3] = q.w;
          }
          const newTrack = new THREE.QuaternionKeyframeTrack(name, track.times, values);
          retargetedTracks.push(newTrack);
          return;
        }

        const newTrack = track.clone();
        newTrack.name = name;
        retargetedTracks.push(newTrack);
      });

      const retargetedClip = new THREE.AnimationClip(
        'SMPLToCCBaseSoccerFixed',
        clip.duration,
        retargetedTracks
      );

      const mixer = new THREE.AnimationMixer(gltf.scene);
      const action = mixer.clipAction(retargetedClip);
      action.play();

      mixerRef.current = mixer;
    }
  }, [gltf, fbx]);

  if (mixerRef.current) {
    mixerRef.current.setTime(t);
  }

  const centerOffsetY = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return -(center.y + size.y * 0.05);
  }, [gltf]);

  return (
    <group position={[0, centerOffsetY, 0]} scale={scale}>
      <primitive object={gltf.scene} />
    </group>
  );
};

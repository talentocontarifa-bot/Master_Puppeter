import React, { useMemo, useRef } from 'react';
import { useCurrentFrame, staticFile, interpolate, spring } from 'remotion';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface RattleAvatarProps {
  scale?: number;
}

export const RattleAvatar: React.FC<RattleAvatarProps> = ({ scale = 1.0 }) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const t = frame / fps;

  const gltf = useLoader(GLTFLoader, staticFile('models/Rattle_rigging.glb'));

  // Find all key AccuRig skeleton bones and store rest rot
  const bones = useMemo(() => {
    const b: Record<string, THREE.Object3D | null> = {
      pelvis: null,
      hip: null,
      spine: null,
      neck: null,
      head: null,
      jaw: null,
      eyeL: null,
      eyeR: null,
      clavL: null,
      clavR: null,
      armL: null,
      armR: null,
      forearmL: null,
      forearmR: null,
      handL: null,
      handR: null,
      thighL: null,
      thighR: null,
      calfL: null,
      calfR: null,
      footL: null,
      footR: null,
    };

    const restRot: Record<string, THREE.Euler> = {};

    gltf.scene.traverse((child) => {
      const n = child.name;
      if (n === 'CC_Base_Pelvis') b.pelvis = child;
      else if (n === 'CC_Base_Hip') b.hip = child;
      else if (n === 'CC_Base_Spine01' || n === 'CC_Base_Spine02') b.spine = b.spine || child;
      else if (n === 'CC_Base_NeckTwist01') b.neck = child;
      else if (n === 'CC_Base_Head') b.head = child;
      else if (n === 'CC_Base_JawRoot') b.jaw = child;
      else if (n === 'CC_Base_L_Eye') b.eyeL = child;
      else if (n === 'CC_Base_R_Eye') b.eyeR = child;
      else if (n === 'CC_Base_L_Clavicle') b.clavL = child;
      else if (n === 'CC_Base_R_Clavicle') b.clavR = child;
      else if (n === 'CC_Base_L_Upperarm') b.armL = child;
      else if (n === 'CC_Base_R_Upperarm') b.armR = child;
      else if (n === 'CC_Base_L_Forearm') b.forearmL = child;
      else if (n === 'CC_Base_R_Forearm') b.forearmR = child;
      else if (n === 'CC_Base_L_Hand') b.handL = child;
      else if (n === 'CC_Base_R_Hand') b.handR = child;
      else if (n === 'CC_Base_L_Thigh') b.thighL = child;
      else if (n === 'CC_Base_R_Thigh') b.thighR = child;
      else if (n === 'CC_Base_L_Calf') b.calfL = child;
      else if (n === 'CC_Base_R_Calf') b.calfR = child;
      else if (n === 'CC_Base_L_Foot') b.footL = child;
      else if (n === 'CC_Base_R_Foot') b.footR = child;

      if (child.isObject3D) {
        restRot[n] = child.rotation.clone();
      }
    });

    return { ...b, restRot };
  }, [gltf]);

  // Center Y offset
  const centerOffsetY = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return -(center.y + size.y * 0.05);
  }, [gltf]);

  // Reset rotations to rest pose before applying frame delta
  Object.keys(bones).forEach((key) => {
    const boneObj = (bones as any)[key];
    if (boneObj && boneObj.name && bones.restRot[boneObj.name]) {
      boneObj.rotation.copy(bones.restRot[boneObj.name]);
    }
  });

  // --- Choreography Phases ---
  // Phase 1 (0 - 180): Walking Forward (Caminata)
  // Phase 2 (180 - 360): Dance Routine (Baile con Rhythm)
  // Phase 3 (360 - 540): Spin 360 & Victory Pose (Giro y Pose Final)

  let walkWeight = 0;
  let danceWeight = 0;
  let poseWeight = 0;

  if (frame < 180) {
    walkWeight = 1 - interpolate(frame, [150, 180], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    danceWeight = interpolate(frame, [150, 180], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else if (frame >= 180 && frame < 360) {
    danceWeight = 1 - interpolate(frame, [330, 360], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    poseWeight = interpolate(frame, [330, 360], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else {
    poseWeight = 1;
  }

  // Position Z translation for walking forward
  const walkZ = interpolate(frame, [0, 160], [1.2, 0.0], { extrapolateRight: 'clamp' });
  const modelZ = walkZ;

  // Model Spin Y for Phase 3
  const spinY = interpolate(frame, [360, 440], [0, Math.PI * 2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ═════ 1. WALKING MOTION ═════
  const walkSpeed = t * 7;
  const legCycleL = Math.sin(walkSpeed);
  const legCycleR = -Math.sin(walkSpeed);

  // Thigh & Calf swings
  const walkThighL = legCycleL * 0.45 * walkWeight;
  const walkThighR = legCycleR * 0.45 * walkWeight;
  const walkCalfL = Math.max(0, -legCycleL) * 0.6 * walkWeight;
  const walkCalfR = Math.max(0, legCycleL) * 0.6 * walkWeight;
  const walkFootL = Math.sin(walkSpeed + 0.5) * 0.2 * walkWeight;
  const walkFootR = -Math.sin(walkSpeed + 0.5) * 0.2 * walkWeight;

  // Arm swings (opposite to legs)
  const walkArmL = -legCycleL * 0.35 * walkWeight;
  const walkArmR = -legCycleR * 0.35 * walkWeight;
  const walkForearmL = Math.abs(legCycleL) * 0.2 * walkWeight;
  const walkForearmR = Math.abs(legCycleR) * 0.2 * walkWeight;

  // Hip bounce and sway
  const walkHipY = Math.abs(Math.sin(walkSpeed * 2)) * 0.04 * walkWeight;
  const walkHipZ = Math.cos(walkSpeed) * 0.03 * walkWeight;
  const walkSpineX = Math.sin(walkSpeed * 2) * 0.02 * walkWeight;

  // ═════ 2. DANCE MOTION ═════
  const danceTempo = t * 11;
  const beat = Math.sin(danceTempo);
  const beatFast = Math.sin(danceTempo * 2);

  // Hip Groove
  const danceHipX = Math.sin(t * 5.5) * 0.08 * danceWeight;
  const danceHipZ = Math.cos(t * 5.5) * 0.06 * danceWeight;
  const danceHipY = Math.abs(beat) * 0.03 * danceWeight;

  // Dance Arms (Waves, Hands up)
  const danceArmLX = (Math.sin(danceTempo) * 0.6 - 0.8) * danceWeight;
  const danceArmRX = (Math.cos(danceTempo) * 0.6 - 0.8) * danceWeight;
  const danceArmLZ = (Math.cos(t * 4) * 0.5 + 0.3) * danceWeight;
  const danceArmRZ = (-Math.sin(t * 4) * 0.5 - 0.3) * danceWeight;
  const danceForearmL = (Math.sin(danceTempo * 1.5) * 0.5 + 0.8) * danceWeight;
  const danceForearmR = (Math.cos(danceTempo * 1.5) * 0.5 + 0.8) * danceWeight;

  // Dance Legs (Stepping & Knee bending)
  const danceThighL = Math.sin(t * 5.5) * 0.25 * danceWeight;
  const danceThighR = -Math.sin(t * 5.5) * 0.25 * danceWeight;
  const danceCalfL = Math.max(0, Math.sin(t * 5.5)) * 0.4 * danceWeight;
  const danceCalfR = Math.max(0, -Math.sin(t * 5.5)) * 0.4 * danceWeight;

  // Head Bop & Jaw sync to dance beat
  const danceHeadX = beatFast * 0.08 * danceWeight;
  const danceHeadY = Math.sin(t * 3) * 0.12 * danceWeight;
  const danceJawOpen = (Math.abs(beat) > 0.6 ? (Math.abs(beat) - 0.6) * 1.2 : 0) * danceWeight;

  // ═════ 3. VICTORY POSE ═════
  const poseArmRX = -1.5 * poseWeight; // Right arm high in the air
  const poseArmRZ = -0.4 * poseWeight;
  const poseForearmR = 0.5 * poseWeight;
  const poseArmLX = 0.3 * poseWeight; // Left hand on hip
  const poseArmLZ = 0.8 * poseWeight;
  const poseForearmL = 1.2 * poseWeight;
  const poseHeadX = -0.15 * poseWeight; // Head tilted back proudly
  const poseHeadY = 0.1 * poseWeight;
  const poseSpineX = -0.08 * poseWeight; // Chest out

  // ═════ APPLY ROTATIONS TO BONES ═════

  // Hips / Pelvis
  if (bones.pelvis) {
    bones.pelvis.position.y += walkHipY + danceHipY;
    bones.pelvis.rotation.z += walkHipZ + danceHipZ;
    bones.pelvis.rotation.x += danceHipX;
  }

  // Left Leg
  if (bones.thighL) bones.thighL.rotation.x += walkThighL + danceThighL;
  if (bones.calfL) bones.calfL.rotation.x += walkCalfL + danceCalfL;
  if (bones.footL) bones.footL.rotation.x += walkFootL;

  // Right Leg
  if (bones.thighR) bones.thighR.rotation.x += walkThighR + danceThighR;
  if (bones.calfR) bones.calfR.rotation.x += walkCalfR + danceCalfR;
  if (bones.footR) bones.footR.rotation.x += walkFootR;

  // Spine & Chest
  if (bones.spine) {
    bones.spine.rotation.x += walkSpineX + poseSpineX + Math.sin(t * 3) * 0.02;
    bones.spine.rotation.y += Math.sin(t * 4) * 0.05 * danceWeight;
  }

  // Left Arm
  if (bones.armL) {
    bones.armL.rotation.x += walkArmL + danceArmLX + poseArmLX;
    bones.armL.rotation.z += danceArmLZ + poseArmLZ;
  }
  if (bones.forearmL) {
    bones.forearmL.rotation.x += walkForearmL + danceForearmL + poseForearmL;
  }

  // Right Arm
  if (bones.armR) {
    bones.armR.rotation.x += walkArmR + danceArmRX + poseArmRX;
    bones.armR.rotation.z += danceArmRZ + poseArmRZ;
  }
  if (bones.forearmR) {
    bones.forearmR.rotation.x += walkForearmR + danceForearmR + poseForearmR;
  }

  // Clavicles (Shoulder popping)
  if (bones.clavL && bones.clavR) {
    bones.clavL.rotation.z += Math.sin(danceTempo) * 0.08 * danceWeight;
    bones.clavR.rotation.z -= Math.sin(danceTempo) * 0.08 * danceWeight;
  }

  // Head & Neck
  if (bones.head) {
    bones.head.rotation.x += danceHeadX + poseHeadX + Math.sin(t * 1.5) * 0.05;
    bones.head.rotation.y += danceHeadY + poseHeadY + Math.sin(t * 0.8) * 0.08;
  }
  if (bones.neck) {
    bones.neck.rotation.x += danceHeadX * 0.5;
  }

  // Jaw (Mouth opening on beat or speech)
  if (bones.jaw) {
    const speechJaw = Math.sin(t * 10) > 0.3 ? 0.25 : 0.02;
    bones.jaw.rotation.x += danceJawOpen + speechJaw * walkWeight;
  }

  // Eyes (Looking around)
  if (bones.eyeL && bones.eyeR) {
    const eyeY = Math.sin(t * 1.2) * 0.15;
    const eyeX = Math.cos(t * 0.9) * 0.08;
    bones.eyeL.rotation.y += eyeY;
    bones.eyeL.rotation.x += eyeX;
    bones.eyeR.rotation.y += eyeY;
    bones.eyeR.rotation.x += eyeX;
  }

  return (
    <group position={[0, centerOffsetY, modelZ]} rotation={[0, spinY, 0]} scale={scale}>
      <primitive object={gltf.scene} />
    </group>
  );
};

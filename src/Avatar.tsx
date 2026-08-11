import React, { useMemo } from 'react';
import { useCurrentFrame, staticFile } from 'remotion';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import lipSyncData from './assets/lipsync.json';

interface AvatarProps {
  jawValues?: number[];
  scale?: number;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function generateBlinkSchedule(totalFrames: number, fps: number): number[] {
  const blinkDuration = 6;
  const blinkValues = new Array(totalFrames).fill(0);
  let nextBlink = Math.floor(fps * 1.5);

  while (nextBlink < totalFrames) {
    for (let i = 0; i < blinkDuration && nextBlink + i < totalFrames; i++) {
      const t = i / (blinkDuration - 1);
      blinkValues[nextBlink + i] = Math.sin(t * Math.PI);
    }
    const interval = 75 + Math.floor(seededRandom(nextBlink) * 75);
    nextBlink += interval;
  }
  return blinkValues;
}

export const Avatar: React.FC<AvatarProps> = ({
  jawValues = lipSyncData.jawValues,
  scale = 1.00 // 80% scale relative to previous 1.35
}) => {
  const frame = useCurrentFrame();
  const gltf = useLoader(GLTFLoader, staticFile('models/Rufino_dialogo_prueba_3.glb'));

  // Morph target meshes
  const morphMeshes = useMemo(() => {
    const meshes: THREE.Mesh[] = [];
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetDictionary) {
        meshes.push(child as THREE.Mesh);
      }
    });
    return meshes;
  }, [gltf]);

  // Find bones & store GLB REST EULER ROTATIONS
  const { headBone, neckBone, spineBone, initialRot } = useMemo(() => {
    let head: THREE.Object3D | null = null;
    let neck: THREE.Object3D | null = null;
    let spine: THREE.Object3D | null = null;

    const rot = {
      head: new THREE.Euler(),
      neck: new THREE.Euler(),
      spine: new THREE.Euler(),
    };

    gltf.scene.traverse((child) => {
      if (child.name === 'Hea' || child.name === 'Head') {
        head = child;
        rot.head.copy(child.rotation);
      } else if (child.name === 'Neck') {
        neck = child;
        rot.neck.copy(child.rotation);
      } else if (child.name === 'Bone' || child.name.toLowerCase().includes('spine')) {
        spine = child;
        rot.spine.copy(child.rotation);
      }
    });

    return { headBone: head, neckBone: neck, spineBone: spine, initialRot: rot };
  }, [gltf]);

  // Center model based on bounding box so head/chest is centered at (0, 0, 0)
  const centerOffsetY = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return -(center.y + size.y * 0.08);
  }, [gltf]);

  // Pre-compute blink schedule
  const blinkSchedule = useMemo(
    () => generateBlinkSchedule(lipSyncData.totalFrames + 60, 30),
    []
  );

  // --- Lip-sync ---
  const targetJaw = jawValues[frame] ?? 0;
  const prevJaw = jawValues[Math.max(0, frame - 1)] ?? 0;
  const currentJaw = prevJaw * 0.3 + targetJaw * 0.7;

  // Eyebrow & smile response
  const browVal = currentJaw > 0.3 ? (currentJaw - 0.3) * 1.0 : 0;
  const blinkValue = blinkSchedule[frame] ?? 0;
  const mouthSmile = currentJaw > 0.2 ? (currentJaw - 0.2) * 0.3 : 0;

  // Apply blendshapes
  morphMeshes.forEach((mesh) => {
    if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

    const set = (name: string, value: number) => {
      const idx = mesh.morphTargetDictionary![name];
      if (idx !== undefined) mesh.morphTargetInfluences![idx] = value;
    };

    set('jawOpen', currentJaw);
    set('mouthOpen', currentJaw * 0.35);
    set('mouthFunnel', currentJaw * 0.15);
    set('mouthSmileLeft', mouthSmile);
    set('mouthSmileRight', mouthSmile);
    set('eyeBlinkLeft', blinkValue);
    set('eyeBlinkRight', blinkValue);
    set('browInnerUp', browVal * 0.5);
    set('browDownLeft', browVal * 0.25);
    set('browDownRight', browVal * 0.25);
    set('cheekSquintLeft', currentJaw * 0.1);
    set('cheekSquintRight', currentJaw * 0.1);
  });

  // --- Natural Head & Neck animation relative to REST POSE ---
  const t = frame / 30;

  const headDeltaX = Math.sin(t * 0.7) * 0.10 + Math.sin(t * 1.6) * 0.05 + (currentJaw > 0.2 ? currentJaw * 0.07 : 0);
  const headDeltaY = Math.sin(t * 0.45) * 0.12 + Math.cos(t * 1.2) * 0.06;
  const headDeltaZ = Math.sin(t * 0.3) * 0.05;

  const neckDeltaX = Math.sin(t * 0.7 - 0.4) * 0.06;
  const neckDeltaY = Math.sin(t * 0.45 - 0.3) * 0.07;
  const neckDeltaZ = Math.sin(t * 0.3 - 0.2) * 0.03;

  const spineDeltaX = Math.sin(t * 0.6) * 0.015;

  if (headBone) {
    headBone.rotation.x = initialRot.head.x + headDeltaX;
    headBone.rotation.y = initialRot.head.y + headDeltaY;
    headBone.rotation.z = initialRot.head.z + headDeltaZ;
  }
  if (neckBone) {
    neckBone.rotation.x = initialRot.neck.x + neckDeltaX;
    neckBone.rotation.y = initialRot.neck.y + neckDeltaY;
    neckBone.rotation.z = initialRot.neck.z + neckDeltaZ;
  }
  if (spineBone) {
    spineBone.rotation.x = initialRot.spine.x + spineDeltaX;
  }

  return (
    <group position={[0, centerOffsetY, 0]} scale={scale}>
      <primitive object={gltf.scene} />
    </group>
  );
};

import React, { useEffect, useRef, useMemo } from 'react';
import { useCurrentFrame, staticFile } from 'remotion';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';
import { buildRetargetedClip } from './utils/retargeting';

interface Props {
  scale?: number;
  useAIMotion?: boolean;
}

export const SuperChristWalkAvatar: React.FC<Props> = ({ scale = 1.0, useAIMotion = true }) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const t = frame / fps;

  const gltf = useLoader(GLTFLoader, staticFile('models/Superchrist_Rig.glb'));
  const fbx = useLoader(FBXLoader, staticFile('models/ai_walk_motion.fbx'));

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  // Retarget FBX walk motion onto SuperChrist GLB using Master Retargeting Engine
  useEffect(() => {
    const mixer = new THREE.AnimationMixer(gltf.scene);

    if (useAIMotion && fbx.animations && fbx.animations.length > 0) {
      const retargetedClip = buildRetargetedClip(
        fbx,
        gltf.scene,
        fbx.animations[0],
        'SuperChristAIWalkClip'
      );

      const action = mixer.clipAction(retargetedClip);
      action.play();
    } else if (gltf.animations.length > 0) {
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
    }

    mixerRef.current = mixer;
  }, [gltf, fbx, useAIMotion]);

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

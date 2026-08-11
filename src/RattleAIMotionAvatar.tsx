import React, { useEffect, useRef, useMemo } from 'react';
import { useCurrentFrame, staticFile } from 'remotion';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';

interface Props {
  scale?: number;
}

export const RattleAIMotionAvatar: React.FC<Props> = ({ scale = 1.0 }) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const t = frame / fps;

  // Load Rattle character GLB (Visible textured model)
  const gltf = useLoader(GLTFLoader, staticFile('models/Rattle_rigging.glb'));
  // Load AI motion FBX
  const fbx = useLoader(FBXLoader, staticFile('models/ai_motion_speaking.fbx'));

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  // Retarget / apply AI motion clip to Rattle GLB model
  useEffect(() => {
    if (fbx.animations && fbx.animations.length > 0) {
      const clip = fbx.animations[0].clone();

      // Create mapping from FBX track names to Rattle CC_Base bone names
      const retargetedTracks: THREE.KeyframeTrack[] = [];

      clip.tracks.forEach((track) => {
        let trackName = track.name;

        // Map common humanoid bone names to CC_Base skeleton
        trackName = trackName
          .replace(/Hips/i, 'CC_Base_Pelvis')
          .replace(/Spine1|Spine/i, 'CC_Base_Spine01')
          .replace(/Neck/i, 'CC_Base_NeckTwist01')
          .replace(/Head/i, 'CC_Base_Head')
          .replace(/LeftArm|LeftUpperArm/i, 'CC_Base_L_Upperarm')
          .replace(/RightArm|RightUpperArm/i, 'CC_Base_R_Upperarm')
          .replace(/LeftForeArm/i, 'CC_Base_L_Forearm')
          .replace(/RightForeArm/i, 'CC_Base_R_Forearm')
          .replace(/LeftHand/i, 'CC_Base_L_Hand')
          .replace(/RightHand/i, 'CC_Base_R_Hand')
          .replace(/LeftUpLeg|LeftThigh/i, 'CC_Base_L_Thigh')
          .replace(/RightUpLeg|RightThigh/i, 'CC_Base_R_Thigh')
          .replace(/LeftLeg|LeftCalf/i, 'CC_Base_L_Calf')
          .replace(/RightLeg|RightCalf/i, 'CC_Base_R_Calf');

        const newTrack = track.clone();
        newTrack.name = trackName;
        retargetedTracks.push(newTrack);
      });

      const retargetedClip = new THREE.AnimationClip(
        'AIMotion',
        clip.duration,
        retargetedTracks.length > 0 ? retargetedTracks : clip.tracks
      );

      const mixer = new THREE.AnimationMixer(gltf.scene);
      const action = mixer.clipAction(retargetedClip);
      action.play();

      // Also play original embedded GLB animation as fallback blend
      if (gltf.animations.length > 0) {
        const fallbackAction = mixer.clipAction(gltf.animations[0]);
        fallbackAction.play();
      }

      mixerRef.current = mixer;
    } else if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
      mixerRef.current = mixer;
    }
  }, [gltf, fbx]);

  if (mixerRef.current) {
    mixerRef.current.setTime(t);
  }

  // Calculate center Y offset for Rattle GLB
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

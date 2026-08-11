import React, { useEffect, useRef, useMemo } from 'react';
import { useCurrentFrame, staticFile } from 'remotion';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';

interface Props {
  scale?: number;
  modelName?: string;
}

export const LegTestAvatar: React.FC<Props> = ({ scale = 1.0, modelName = 'models/Rattle_rigging.glb' }) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const t = frame / fps;

  const gltf = useLoader(GLTFLoader, staticFile(modelName));
  const fbx = useLoader(FBXLoader, staticFile('models/ai_leg_test_motion.fbx'));

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    if (fbx.animations && fbx.animations.length > 0) {
      const clip = fbx.animations[0].clone();
      const retargetedTracks: THREE.KeyframeTrack[] = [];

      clip.tracks.forEach((track) => {
        let name = track.name;
        const isQuaternion = track instanceof THREE.QuaternionKeyframeTrack;

        // Isolate Right Leg joints only (Thigh, Knee, Foot)
        if (name.includes('R_Hip') || name.includes('RightHip') || name.includes('R_UpLeg') || name.includes('RightUpLeg')) {
          name = 'CC_Base_R_Thigh.quaternion';
        } else if (name.includes('R_Knee') || name.includes('RightKnee') || name.includes('R_Leg') || name.includes('RightLeg')) {
          name = 'CC_Base_R_Calf.quaternion';
        } else if (name.includes('R_Ankle') || name.includes('R_Foot') || name.includes('RightFoot')) {
          name = 'CC_Base_R_Foot.quaternion';
        } else {
          return; // Discard torso/left leg/arm tracks so body stays perfectly still
        }

        if (isQuaternion) {
          const newTrack = track.clone();
          newTrack.name = name;
          retargetedTracks.push(newTrack);
        }
      });

      const retargetedClip = new THREE.AnimationClip(
        'DiagnosticSingleLegClip',
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

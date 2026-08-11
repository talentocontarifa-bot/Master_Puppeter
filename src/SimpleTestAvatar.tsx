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

export const SimpleTestAvatar: React.FC<Props> = ({ scale = 1.0, modelName = 'models/Rattle_rigging.glb' }) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const t = frame / fps;

  const gltf = useLoader(GLTFLoader, staticFile(modelName));
  const fbx = useLoader(FBXLoader, staticFile('models/ai_simple_test_motion.fbx'));

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    if (fbx.animations && fbx.animations.length > 0) {
      const clip = fbx.animations[0].clone();
      const retargetedTracks: THREE.KeyframeTrack[] = [];

      // Offset quaternion to flip right arm rotation from BACKWARD to FORWARD
      const armForwardFix = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

      clip.tracks.forEach((track) => {
        let name = track.name;
        const isQuaternion = track instanceof THREE.QuaternionKeyframeTrack;

        if (name.includes('R_Shoulder') || name.includes('RightShoulder') || name.includes('R_Arm')) {
          name = 'CC_Base_R_Upperarm.quaternion';
        } else if (name.includes('R_Elbow') || name.includes('RightElbow') || name.includes('R_ForeArm')) {
          name = 'CC_Base_R_Forearm.quaternion';
        } else {
          return; // Keep rest pose for all other bones
        }

        if (isQuaternion) {
          const values = new Float32Array(track.values);
          for (let i = 0; i < values.length; i += 4) {
            const q = new THREE.Quaternion(values[i], values[i + 1], values[i + 2], values[i + 3]);
            q.premultiply(armForwardFix);
            values[i] = q.x;
            values[i + 1] = q.y;
            values[i + 2] = q.z;
            values[i + 3] = q.w;
          }
          const newTrack = new THREE.QuaternionKeyframeTrack(name, track.times, values);
          retargetedTracks.push(newTrack);
        }
      });

      const retargetedClip = new THREE.AnimationClip(
        'DiagnosticArmForwardClip',
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

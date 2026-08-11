import React, { useMemo, useLayoutEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SuperChristAvatar } from '../SuperChristAvatar';

const CameraController: React.FC<{ pos: [number, number, number]; fov: number; lookAt?: [number, number, number] }> = ({
  pos,
  fov,
  lookAt = [0, 0, 0],
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
    const perspCam = camera as THREE.PerspectiveCamera;
    if (perspCam.fov !== fov) {
      perspCam.fov = fov;
      perspCam.updateProjectionMatrix();
    }
  }, [camera, pos, fov, lookAt]);

  return null;
};

export const SuperChristShowcase: React.FC = () => {
  const frame = useCurrentFrame();

  const cameraConfig = useMemo(() => {
    let pos: [number, number, number] = [0, 0, 2.8];
    let lookAt: [number, number, number] = [0, 0, 0];
    let fov = 26;

    if (frame < 60) {
      // Cut 1: Running Camera Tracking
      const zoomZ = interpolate(frame, [0, 60], [2.9, 2.4]);
      pos = [0, 0.05, zoomZ];
      fov = 26;
    } else if (frame >= 60 && frame < 120) {
      // Cut 2: Low-Angle Impact Close-up!
      pos = [0.35, -0.3, 1.85];
      lookAt = [0, 0.1, 0];
      fov = 20;
    } else {
      // Cut 3: Stadium Follow-Through Shot
      pos = [-0.25, 0.05, 2.6];
      fov = 25;
    }

    return { pos, fov, lookAt };
  }, [frame]);

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 40%, #201a36 0%, #0d0a1c 60%, #030208 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <ThreeCanvas
        width={1920}
        height={1080}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraController pos={cameraConfig.pos} fov={cameraConfig.fov} lookAt={cameraConfig.lookAt} />

        {/* Studio & Stage Lighting */}
        <ambientLight intensity={0.7} color="#ffffff" />
        <directionalLight position={[2.8, 3.5, 3]} intensity={2.2} color="#fff2e6" />
        <directionalLight position={[-2.8, 2, 2]} intensity={0.7} color="#60a5fa" />
        <directionalLight position={[0, 3, -2.8]} intensity={1.6} color="#c084fc" />
        <pointLight position={[0, 2.5, 1]} intensity={0.6} color="#ffffff" />

        {/* SuperChrist Avatar with AI Motion */}
        <SuperChristAvatar scale={1.0} useAIMotion={true} />
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 45%, rgba(0, 0, 0, 0) 45%, rgba(12, 6, 18, 0.5) 80%, rgba(0, 0, 0, 0.85) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

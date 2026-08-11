import React, { useMemo, useLayoutEffect } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SuperChristWalkAvatar } from '../SuperChristWalkAvatar';

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

export const SuperChristWalkShowcase: React.FC = () => {
  const cameraConfig = useMemo(() => {
    // Plano General Estático para observar la caminata completa in-place
    const pos: [number, number, number] = [0, 0, 6.5];
    const lookAt: [number, number, number] = [0, 0, 0];
    const fov = 45;

    return { pos, fov, lookAt };
  }, []);

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 40%, #1e1b4b 0%, #0f172a 60%, #020617 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <ThreeCanvas
        width={1920}
        height={1080}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraController pos={cameraConfig.pos} fov={cameraConfig.fov} lookAt={cameraConfig.lookAt} />

        {/* Cinematographic Studio Lighting */}
        <ambientLight intensity={0.7} color="#ffffff" />
        <directionalLight position={[3, 4, 3]} intensity={2.2} color="#f8fafc" />
        <directionalLight position={[-3, 2, 2]} intensity={0.8} color="#818cf8" />
        <directionalLight position={[0, 4, -3]} intensity={1.6} color="#c084fc" />
        <pointLight position={[0, 2.5, 1]} intensity={0.6} color="#ffffff" />

        {/* SuperChrist Walkthrough Avatar */}
        <SuperChristWalkAvatar scale={1.0} useAIMotion={true} />
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 45%, rgba(0, 0, 0, 0) 45%, rgba(15, 23, 42, 0.5) 80%, rgba(2, 6, 23, 0.85) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

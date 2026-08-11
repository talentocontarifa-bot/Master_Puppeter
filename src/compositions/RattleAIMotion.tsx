import React, { useMemo, useLayoutEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RattleAIMotionAvatar } from '../RattleAIMotionAvatar';

const CameraController: React.FC<{ pos: [number, number, number]; fov: number }> = ({ pos, fov }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(0, 0, 0);
    const perspCam = camera as THREE.PerspectiveCamera;
    if (perspCam.fov !== fov) {
      perspCam.fov = fov;
      perspCam.updateProjectionMatrix();
    }
  }, [camera, pos, fov]);

  return null;
};

export const RattleAIMotion: React.FC = () => {
  const frame = useCurrentFrame();

  const cameraConfig = useMemo(() => {
    const zoomZ = interpolate(frame, [0, 150], [2.7, 2.2]);
    return { pos: [0, 0.05, zoomZ] as [number, number, number], fov: 26 };
  }, [frame]);

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 40%, #1e1e42 0%, #0d0d22 55%, #03030b 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <ThreeCanvas
        width={1920}
        height={1080}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraController pos={cameraConfig.pos} fov={cameraConfig.fov} />

        {/* Studio Lighting */}
        <ambientLight intensity={0.65} color="#ffffff" />
        <directionalLight position={[2.5, 3, 3]} intensity={2.0} color="#fff4e6" />
        <directionalLight position={[-2.5, 2, 2]} intensity={0.7} color="#60a5fa" />
        <directionalLight position={[0, 3, -2.5]} intensity={1.5} color="#00f2fe" />
        <pointLight position={[0, 2, 1]} intensity={0.5} color="#ffffff" />

        {/* Visible Rattle GLB model with AI motion applied */}
        <RattleAIMotionAvatar scale={1.0} />
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 45%, rgba(0, 0, 0, 0) 45%, rgba(2, 2, 8, 0.55) 80%, rgba(0, 0, 0, 0.85) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

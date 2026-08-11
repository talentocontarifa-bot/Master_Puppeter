import React, { useMemo, useLayoutEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RattleAISoccerAvatar } from '../RattleAISoccerAvatar';

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

export const RattleAISoccer: React.FC = () => {
  const frame = useCurrentFrame();

  const cameraConfig = useMemo(() => {
    // Static Wide Angle General Shot (Plano General Estático)
    // Distance Z=6.0, FOV=45 to see full translation & motion without camera cuts
    const pos: [number, number, number] = [0, 0, 6.0];
    const lookAt: [number, number, number] = [0, 0, 0];
    const fov = 45;

    return { pos, fov, lookAt };
  }, []);

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 40%, #163624 0%, #091c12 60%, #020804 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <ThreeCanvas
        width={1920}
        height={1080}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraController pos={cameraConfig.pos} fov={cameraConfig.fov} lookAt={cameraConfig.lookAt} />

        {/* Stadium Sports Floodlighting */}
        <ambientLight intensity={0.7} color="#ffffff" />
        <directionalLight position={[3, 4, 3]} intensity={2.4} color="#ffffff" />
        <directionalLight position={[-3, 2, 2]} intensity={0.8} color="#4ade80" />
        <directionalLight position={[0, 4, -3]} intensity={1.8} color="#38bdf8" />
        <pointLight position={[0, 2, 1]} intensity={0.6} color="#ffffff" />

        {/* AI Soccer Kick Avatar */}
        <RattleAISoccerAvatar scale={1.0} />
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 45%, rgba(0, 0, 0, 0) 45%, rgba(2, 12, 6, 0.5) 80%, rgba(0, 0, 0, 0.85) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

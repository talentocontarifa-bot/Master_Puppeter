import React, { useMemo, useLayoutEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LegTestAvatar } from '../LegTestAvatar';

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

export const LegTest: React.FC = () => {
  const frame = useCurrentFrame();

  const cameraConfig = useMemo(() => {
    const panX = interpolate(frame, [0, 120], [-0.15, 0.15]);
    return {
      pos: [panX, -0.1, 2.4] as [number, number, number],
      fov: 28,
      lookAt: [0, -0.1, 0] as [number, number, number],
    };
  }, [frame]);

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 40%, #0f172a 0%, #020617 60%, #000000 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <ThreeCanvas
        width={1920}
        height={1080}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraController pos={cameraConfig.pos} fov={cameraConfig.fov} lookAt={cameraConfig.lookAt} />

        {/* Clean Studio Lighting */}
        <ambientLight intensity={0.8} color="#ffffff" />
        <directionalLight position={[3, 4, 3]} intensity={2.2} color="#ffffff" />
        <directionalLight position={[-3, 2, 2]} intensity={0.8} color="#38bdf8" />

        {/* Leg Diagnostic Avatar with Single-Leg Kick Motion */}
        <LegTestAvatar scale={1.0} modelName="models/Rattle_rigging.glb" />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

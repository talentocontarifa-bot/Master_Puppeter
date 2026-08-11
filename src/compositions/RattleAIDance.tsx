import React, { useMemo, useLayoutEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RattleAIDanceAvatar } from '../RattleAIDanceAvatar';

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

export const RattleAIDance: React.FC = () => {
  const frame = useCurrentFrame();

  const cameraConfig = useMemo(() => {
    let pos: [number, number, number] = [0, 0, 2.6];
    let lookAt: [number, number, number] = [0, 0, 0];
    let fov = 26;

    if (frame < 80) {
      // Cut 1: Medium Shot Tracking Dance
      const zoomZ = interpolate(frame, [0, 80], [2.7, 2.3]);
      pos = [0, 0.05, zoomZ];
      fov = 26;
    } else if (frame >= 80 && frame < 160) {
      // Cut 2: Dynamic Hip & Upper Body Close-up Pan
      const panX = Math.sin((frame - 80) * 0.08) * 0.35;
      pos = [panX, 0.08, 1.75];
      lookAt = [0, 0.05, 0];
      fov = 20;
    } else {
      // Cut 3: Low Angle Stage Concert View
      pos = [0.25, -0.3, 2.2];
      lookAt = [0, 0.15, 0];
      fov = 25;
    }

    return { pos, fov, lookAt };
  }, [frame]);

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 40%, #2a1636 0%, #12091c 60%, #040208 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <ThreeCanvas
        width={1920}
        height={1080}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraController pos={cameraConfig.pos} fov={cameraConfig.fov} lookAt={cameraConfig.lookAt} />

        {/* Dance & Concert Stage Lighting */}
        <ambientLight intensity={0.7} color="#ffffff" />
        <directionalLight position={[2.8, 3.5, 3]} intensity={2.2} color="#ffdfd4" />
        <directionalLight position={[-2.8, 2, 2]} intensity={0.8} color="#be185d" />
        <directionalLight position={[0, 3, -2.8]} intensity={1.8} color="#a855f7" />
        <pointLight position={[0, 2.5, 1]} intensity={0.7} color="#ffffff" />
        <pointLight position={[-1.5, -0.5, 1.5]} intensity={0.6} color="#ec4899" />

        {/* AI Bachata Dance Avatar */}
        <RattleAIDanceAvatar scale={1.0} />
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 45%, rgba(0, 0, 0, 0) 45%, rgba(12, 2, 18, 0.5) 80%, rgba(0, 0, 0, 0.85) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

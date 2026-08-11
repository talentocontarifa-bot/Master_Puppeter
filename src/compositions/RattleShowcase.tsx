import React, { useMemo, useLayoutEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RattleAvatar } from '../RattleAvatar';

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

export const RattleShowcase: React.FC = () => {
  const frame = useCurrentFrame();

  // Dynamic Camera Cut Sequences:
  // - Cut 1 (0-180): Walking Track Cam (Camera backs up as Rattle walks forward)
  // - Cut 2 (180-300): Dance Beat Close-up / Medium (Dynamic zoom & angled pan to the rhythm)
  // - Cut 3 (300-420): Low Angle Hip-Hop Dance Shot
  // - Cut 4 (420-540): Hero Low Angle Victory Pose Shot

  const cameraConfig = useMemo(() => {
    let pos: [number, number, number] = [0, 0, 3.2];
    let lookAt: [number, number, number] = [0, 0, 0];
    let fov = 28;

    if (frame < 180) {
      // Cut 1: Walking Camera - Tracks Rattle as he advances forward
      const walkZ = interpolate(frame, [0, 160], [1.2, 0.0], { extrapolateRight: 'clamp' });
      const camZ = walkZ + 2.4;
      pos = [0, 0.05, camZ];
      lookAt = [0, 0, walkZ];
      fov = 28;
    } else if (frame >= 180 && frame < 300) {
      // Cut 2: Dance Beat - Close-Up / Upper Body Groove
      const panX = Math.sin((frame - 180) * 0.08) * 0.25;
      const zoomZ = 1.7 + Math.cos((frame - 180) * 0.1) * 0.15;
      pos = [panX, 0.1, zoomZ];
      lookAt = [0, 0.05, 0];
      fov = 20;
    } else if (frame >= 300 && frame < 420) {
      // Cut 3: Low-Angle Dance Camera
      const panX = interpolate(frame, [300, 420], [-0.5, 0.5]);
      pos = [panX, -0.4, 2.2];
      lookAt = [0, 0.1, 0];
      fov = 26;
    } else {
      // Cut 4: Dramatic Hero Low-Angle Victory Shot
      const zoomZ = interpolate(frame, [420, 540], [2.4, 2.0]);
      pos = [0.2, -0.3, zoomZ];
      lookAt = [0, 0.2, 0];
      fov = 24;
    }

    return { pos, fov, lookAt };
  }, [frame]);

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 40%, #1e1e42 0%, #0d0d22 55%, #03030b 100%)',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* 3D Scene with Rattle Rigged Puppet */}
      <ThreeCanvas
        width={1920}
        height={1080}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraController pos={cameraConfig.pos} fov={cameraConfig.fov} lookAt={cameraConfig.lookAt} />

        {/* 5-Point Studio Concert & Stage Lighting */}
        <ambientLight intensity={0.65} color="#ffffff" />
        <directionalLight position={[2.8, 3.5, 3]} intensity={2.0} color="#fff2e6" />
        <directionalLight position={[-2.8, 2, 2]} intensity={0.7} color="#60a5fa" />
        <directionalLight position={[0, 3, -2.8]} intensity={1.6} color="#00f2fe" />
        <pointLight position={[0, 2.5, 1]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-1.5, -0.5, 1.5]} intensity={0.5} color="#a855f7" />

        {/* Rattle Puppet with Walk, Dance & Victory Choreography */}
        <RattleAvatar scale={1.0} />
      </ThreeCanvas>

      {/* Cinematic Vignette */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 45%, rgba(0, 0, 0, 0) 45%, rgba(2, 2, 8, 0.55) 80%, rgba(0, 0, 0, 0.85) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

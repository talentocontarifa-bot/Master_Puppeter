import React, { useMemo, useLayoutEffect } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Avatar } from '../Avatar';
import { Subtitles } from '../Subtitles';

// Inner camera controller that forces Three.js camera updates frame by frame
const CameraController: React.FC<{ pos: [number, number, number]; fov: number }> = ({ pos, fov }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(pos[0], pos[1], pos[2]);
    const perspCam = camera as THREE.PerspectiveCamera;
    if (perspCam.fov !== fov) {
      perspCam.fov = fov;
      perspCam.updateProjectionMatrix();
    }
  }, [camera, pos, fov]);

  return null;
};

export const IntroVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // ═══ Explicit Dynamic Camera Angle Cuts ═══
  // - Cut 1 (0-140): Plano Medio Centrado (50mm, fov 27) with continuous zoom-in
  // - Cut 2 (140-440): Plano Detalle / Close-up Rostro (85mm, fov 18, z=1.65)
  // - Cut 3 (440-780): Plano Tres Cuartos / Ángulo (50mm, x=0.45, z=2.4)
  // - Cut 4 (780-1140): Plano Medio Centrado (50mm)
  // - Cut 5 (1140-1440): Close-up Rostro (85mm)
  // - Cut 6 (1440-end): Plano Medio Centrado

  const cameraConfig = useMemo(() => {
    let pos: [number, number, number] = [0, 0, 2.7];
    let fov = 27;

    if (frame < 140) {
      // Cut 1: Medium shot with dramatic slow push-in zoom
      const zoomZ = interpolate(frame, [0, 140], [2.85, 2.45]);
      pos = [0, 0, zoomZ];
      fov = 27;
    } else if (frame >= 140 && frame < 440) {
      // Cut 2: DRAMATIC CLOSE-UP ON FACE (85mm lens, zoomed in to face)
      const zoomZ = interpolate(frame, [140, 440], [1.75, 1.62]);
      pos = [0, 0.08, zoomZ];
      fov = 18;
    } else if (frame >= 440 && frame < 780) {
      // Cut 3: THREE-QUARTER ANGLED SHOTS (x shifted right)
      const panX = interpolate(frame, [440, 780], [0.42, 0.52]);
      pos = [panX, 0.04, 2.45];
      fov = 26;
    } else if (frame >= 780 && frame < 1140) {
      // Cut 4: Medium Shot centered with slow zoom
      const zoomZ = interpolate(frame, [780, 1140], [2.75, 2.50]);
      pos = [0, 0, zoomZ];
      fov = 27;
    } else if (frame >= 1140 && frame < 1440) {
      // Cut 5: Close-Up Face Zoom
      pos = [-0.08, 0.08, 1.68];
      fov = 18;
    } else {
      // Cut 6: Final Medium Shot
      pos = [0, 0, 2.70];
      fov = 27;
    }

    return { pos, fov };
  }, [frame]);

  // Background music volume: ULTRA LOW (1.5% max) so it never overpowers speech
  const musicVolume = interpolate(
    frame,
    [0, 45, durationInFrames - 60, durationInFrames],
    [0, 0.015, 0.015, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 40%, #1e1e42 0%, #0d0d22 50%, #04040c 100%)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      {/* 3D Scene with Rufino Avatar */}
      <ThreeCanvas
        width={1920}
        height={1080}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Dynamic Frame-by-Frame Camera Controller */}
        <CameraController pos={cameraConfig.pos} fov={cameraConfig.fov} />

        {/* ═══ Studio 5-Point Lighting Setup ═══ */}
        <ambientLight intensity={0.55} color="#ffffff" />
        <directionalLight position={[2.2, 2.5, 3]} intensity={1.6} color="#fff6eb" />
        <directionalLight position={[-2.2, 1.5, 2]} intensity={0.55} color="#8cbbfd" />
        <directionalLight position={[0, 2.5, -2]} intensity={1.3} color="#00f2fe" />
        <pointLight position={[0, 3, 0.5]} intensity={0.65} color="#ffffff" />
        <pointLight position={[1.8, -0.5, 1]} intensity={0.35} color="#ff9944" />

        {/* Avatar at 80% scale */}
        <Avatar scale={1.0} />
      </ThreeCanvas>

      {/* ═══ Post-Processing Filter Overlays ═══ */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          backdropFilter: 'blur(0.3px)',
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 45%, rgba(0, 0, 0, 0) 50%, rgba(2, 2, 8, 0.45) 85%, rgba(0, 0, 0, 0.75) 100%)',
        }}
      />

      {/* Voice Audio Track (Javier - Main Speech) */}
      <Audio src={staticFile('audio/audio_intro.mp3')} />

      {/* Background Music Track (AlexGuz) at ULTRA-LOW 1.5% volume */}
      <Audio
        src={staticFile('audio/bg_music.mp3')}
        volume={musicVolume}
        loop
      />

      {/* Animated Timed Subtitles */}
      <Subtitles />
    </AbsoluteFill>
  );
};

import React, { useMemo } from 'react';
import { useCurrentFrame } from 'remotion';
import * as THREE from 'three';

interface ParticlesProps {
  count?: number;
}

export const Particles: React.FC<ParticlesProps> = ({ count = 180 }) => {
  const frame = useCurrentFrame();

  // Generate random 3D positions, speeds, and sizes
  const [positions, initialPositions, speeds, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const initPos = new Float32Array(count * 3);
    const spd = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 6;
      const y = (Math.random() - 0.5) * 4;
      const z = (Math.random() - 0.5) * 4 - 0.5;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;

      spd[i * 3] = (Math.random() - 0.5) * 0.2;
      spd[i * 3 + 1] = 0.15 + Math.random() * 0.25; // Gentle upward drift
      spd[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

      sz[i] = 0.02 + Math.random() * 0.04;
    }

    return [pos, initPos, spd, sz];
  }, [count]);

  // Update positions for the current frame
  const currentPositions = useMemo(() => {
    const t = frame / 30;
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Upward drift with gentle sine wave wobble
      let y = initialPositions[i * 3 + 1] + t * speeds[i * 3 + 1];
      // Wrap around Y boundary (-2 to +2)
      y = ((y + 2) % 4) - 2;

      const x = initialPositions[i * 3] + Math.sin(t * 0.8 + i) * 0.15;
      const z = initialPositions[i * 3 + 2] + Math.cos(t * 0.6 + i) * 0.1;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }

    return pos;
  }, [frame, count, initialPositions, speeds]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    return geo;
  }, [currentPositions]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.035}
        color="#818cf8"
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export interface CaptionCue {
  startFrame: number;
  endFrame: number;
  text: string;
  highlightWord?: string;
}

// Timed cues matching the audio script (~54 seconds / 1628 frames @ 30fps)
export const captionCues: CaptionCue[] = [
  { startFrame: 15, endFrame: 130, text: "Hola a todos, soy Rufino, tu gemelo digital." },
  { startFrame: 140, endFrame: 430, text: "Hoy estamos realizando una prueba completa de generación de video automatizado utilizando Remotion y Three.js." },
  { startFrame: 440, endFrame: 780, text: "Con este sistema podemos crear avatares 3D que cobran vida con lip-sync preciso e iluminación de estudio." },
  { startFrame: 790, endFrame: 1140, text: "Imagina las posibilidades: tutoriales, presentaciones, noticias o contenido continuo para redes sin cámaras ni luces." },
  { startFrame: 1150, endFrame: 1440, text: "Todo este proceso es completamente matemático, rápido y optimizado para rendir en cualquier servidor." },
  { startFrame: 1450, endFrame: 1610, text: "Espero que disfrutes de esta demostración. ¡Nos vemos en el próximo video y muchas gracias por acompañarme!" }
];

export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find active cue
  const activeCue = captionCues.find(c => frame >= c.startFrame && frame <= c.endFrame);

  if (!activeCue) return null;

  const cueProgress = frame - activeCue.startFrame;
  const cueDuration = activeCue.endFrame - activeCue.startFrame;

  // Spring animation for entrance
  const entrance = spring({
    frame: cueProgress,
    fps,
    config: { damping: 14, stiffness: 120 }
  });

  const opacity = interpolate(
    cueProgress,
    [0, 10, cueDuration - 10, cueDuration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 55,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 40px',
        pointerEvents: 'none',
        opacity,
        transform: `translateY(${(1 - entrance) * 20}px)`
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(12, 12, 32, 0.82) 0%, rgba(24, 18, 50, 0.75) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(99, 102, 241, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          borderRadius: '18px',
          padding: '16px 36px',
          maxWidth: '1100px',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: '26px',
            fontWeight: 600,
            lineHeight: 1.4,
            color: '#ffffff',
            letterSpacing: '0.4px',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}
        >
          {activeCue.text}
        </span>
      </div>
    </div>
  );
};

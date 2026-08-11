import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const paragraphs = [
  "Hola a todos, soy Rufino, tu gemelo digital. Hoy estamos realizando una prueba completa de generación de video automatizado utilizando Remotion y Three.js.",
  "Con este sistema podemos crear avatares en tres dimensiones que cobran vida con sincronización labial precisa, movimientos faciales fluidos e iluminación de estudio.",
  "Imagina las posibilidades: tutoriales interactivos, presentaciones ejecutivas, resúmenes de noticias o contenido continuo para redes sociales sin necesidad de cámaras ni luces.",
  "Todo este proceso es completamente matemático, rápido y optimizado para rendir al máximo en cualquier servidor de renderizado.",
  "Espero que disfrutes de esta demostración completa de un minuto de duración. ¡Nos vemos en el próximo video y muchas gracias por acompañarme!"
];

const outputPath = path.join(__dirname, '..', 'public', 'audio', 'audio_intro.mp3');

console.log('🎙️ Fetching audio chunks from TTS Worker...');

const audioBuffers = [];

for (let i = 0; i < paragraphs.length; i++) {
  const text = paragraphs[i];
  const url = `https://tts-worker.disenocorptpc.workers.dev/tts?text=${encodeURIComponent(text)}&speaker=javier`;
  console.log(`📡 Fetching chunk ${i + 1}/${paragraphs.length}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Chunk ${i + 1} failed: ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  audioBuffers.push(Buffer.from(buf));
}

const finalBuffer = Buffer.concat(audioBuffers);
fs.writeFileSync(outputPath, finalBuffer);
console.log(`✅ Combined 1-minute audio saved to: ${outputPath} (${(finalBuffer.length / 1024).toFixed(1)} KB)`);

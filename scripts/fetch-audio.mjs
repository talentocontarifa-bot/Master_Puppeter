import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptText = `Hola a todos, soy Rufino, tu gemelo digital. Hoy estamos realizando una prueba completa de generación de video automatizado utilizando Remotion y Three.js. Con este sistema podemos crear avatares en tres dimensiones que cobran vida con sincronización labial precisa, movimientos faciales fluidos e iluminación cinematográfica. Imagina las posibilidades: videos educativos, presentaciones ejecutivas, resúmenes de noticias o contenido continuo para redes sociales sin necesidad de grabar cámaras ni luces. Todo es producido de forma matemática y determinista. Espero que disfrutes de esta demostración de un minuto de duración. ¡Nos vemos en el próximo episodio!`;

const encodedText = encodeURIComponent(scriptText);
const ttsUrl = `https://tts-worker.disenocorptpc.workers.dev/tts?text=${encodedText}&speaker=javier`;
const outputPath = path.join(__dirname, '..', 'public', 'audio', 'audio_intro.mp3');

console.log('🎙️ Requesting 1-minute TTS audio from Worker...');

try {
  const res = await fetch(ttsUrl);
  if (!res.ok) {
    throw new Error(`Worker returned status ${res.status}: ${res.statusText}`);
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`✅ Audio saved to: ${outputPath} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error('❌ Failed to fetch TTS audio:', err);
}

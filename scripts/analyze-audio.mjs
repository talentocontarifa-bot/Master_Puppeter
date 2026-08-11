import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const audioMp3Path = path.join(projectRoot, 'public', 'audio', 'audio_intro.mp3');
const tempPcmPath = path.join(projectRoot, 'public', 'audio', 'temp_intro.pcm');
const outputPath = path.join(projectRoot, 'src', 'assets', 'lipsync.json');

const sampleRate = 44100;
const fps = 30;
const samplesPerFrame = Math.floor(sampleRate / fps); // 1470

console.log('🔄 Converting MP3 to PCM using ffmpeg...');
execSync(`ffmpeg -y -i "${audioMp3Path}" -f s16le -ac 1 -ar ${sampleRate} "${tempPcmPath}"`, { stdio: 'inherit' });

const pcmBuffer = fs.readFileSync(tempPcmPath);
const totalSamples = Math.floor(pcmBuffer.length / 2);
const totalFrames = Math.ceil(totalSamples / samplesPerFrame);

console.log(`📊 Audio PCM length: ${totalSamples} samples, Total frames @ ${fps}fps: ${totalFrames}`);

const rawJawValues = [];

for (let frame = 0; frame < totalFrames; frame++) {
  const startSample = frame * samplesPerFrame;
  const endSample = Math.min(totalSamples, startSample + samplesPerFrame);
  
  let sumSquare = 0;
  let count = 0;

  for (let i = startSample; i < endSample; i++) {
    const sampleInt16 = pcmBuffer.readInt16LE(i * 2);
    const sampleNormalized = sampleInt16 / 32768.0;
    sumSquare += sampleNormalized * sampleNormalized;
    count++;
  }

  const rms = count > 0 ? Math.sqrt(sumSquare / count) : 0;

  // Formula as specified in briefing Section 7:
  // RMS threshold = 0.01, RMS scaling = 15, Max jawOpen = 0.70
  let rawJaw = 0;
  if (rms > 0.01) {
    rawJaw = Math.min(0.70, (rms - 0.01) * 15);
  }

  rawJawValues.push(rawJaw);
}

// Apply smoothing (70% current + 30% previous frame)
const smoothedJawValues = [];
let prevJaw = 0;

for (let i = 0; i < rawJawValues.length; i++) {
  const currentRaw = rawJawValues[i];
  const smoothJaw = prevJaw * 0.3 + currentRaw * 0.7;
  smoothedJawValues.push(Number(smoothJaw.toFixed(4)));
  prevJaw = smoothJaw;
}

// Clean up temporary PCM file
if (fs.existsSync(tempPcmPath)) {
  fs.unlinkSync(tempPcmPath);
}

// Ensure src/assets directory exists
const assetsDir = path.dirname(outputPath);
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const lipSyncData = {
  fps,
  totalFrames,
  durationInSeconds: totalFrames / fps,
  jawValues: smoothedJawValues
};

fs.writeFileSync(outputPath, JSON.stringify(lipSyncData, null, 2));
console.log(`✅ Lip-sync data successfully generated at: ${outputPath}`);
console.log(`📈 Sample jawValues (first 15 frames):`, smoothedJawValues.slice(0, 15));

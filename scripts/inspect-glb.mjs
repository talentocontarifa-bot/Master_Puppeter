import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Node script to analyze GLB bone hierarchy and mesh bounds
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const glbPath = path.join(__dirname, '..', 'public', 'models', 'Rufino_digital.glb');

console.log('GLB file size:', (fs.statSync(glbPath).size / 1024 / 1024).toFixed(2), 'MB');

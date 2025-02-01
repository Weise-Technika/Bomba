import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const one2carScript = path.join(__dirname, 'one2car', 'one2car.js');
const uploadScript = path.join(__dirname, 'one2car', 'uploadOne2carData.js');

// รันไฟล์ one2car.js
const processOne2car = spawn('node', [one2carScript], { stdio: 'inherit' });

processOne2car.on('close', (code) => { 
  if (code === 0) {
    // รันไฟล์ uploadOne2carData.js ต่อ
    const processUpload = spawn('node', [uploadScript], { stdio: 'inherit' });

    
  }
});
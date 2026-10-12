const { spawn } = require('child_process');

process.env.SPLASH_PREVIEW = '1';
const child = process.platform === 'win32'
  ? spawn('cmd.exe', ['/c', 'npx', 'electron-vite', 'dev'], { stdio: 'inherit', env: process.env })
  : spawn('npx', ['electron-vite', 'dev'], { stdio: 'inherit', env: process.env });

child.on('exit', (code) => {
  process.exit(code || 0);
});

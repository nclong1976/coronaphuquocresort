/**
 * Luôn chạy Vite từ root frontend. Tránh `npm run dev backend` — npm nối thêm `backend`
 * thành tham số root của Vite và làm hỏng proxy /api → 500.
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

const child = spawn(process.execPath, [vite, '--port=3001', '--host=0.0.0.0'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
child.on('exit', (code) => process.exit(code ?? 0));

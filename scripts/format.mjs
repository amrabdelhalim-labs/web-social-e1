import { execSync } from 'child_process';
import { platform } from 'os';

const isWindows = platform() === 'win32';
const quote = isWindows ? '"' : "'";
const pattern = `${quote}**/*.{js,jsx,ts,tsx,json,css,md,mjs,mts}${quote}`;

const isCheck = process.argv.includes('--check');
const command = isCheck ? `npx prettier --check ${pattern}` : `npx prettier --write ${pattern}`;

try {
  execSync(command, { stdio: 'inherit' });
} catch {
  process.exit(1);
}

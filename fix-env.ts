
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const content = `VITE_FOOTBALL_API_KEY=e223a5ff8ea64524bf596aa5abc37aad`;

console.log('Writing .env with UTF-8 encoding...');
fs.writeFileSync(envPath, content, { encoding: 'utf-8' });
console.log('Done.');

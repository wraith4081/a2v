import fs from 'fs';
import path from 'path';
import A2V from './lib/a2v';

const p = path.join(__dirname, '../subtitle/subtitle.ass');

const content = fs.readFileSync(p, 'utf-8');

fs.writeFileSync(p.replace('.ass', '.vtt'), new A2V(content).toVTT())
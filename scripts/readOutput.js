// readOutput.js - Reads output.txt (UTF-16LE) and prints UTF-8 JSON
import { readFileSync } from 'fs';
import { resolve } from 'path';

const filePath = resolve('output.txt');
// Read with UTF-16LE encoding and convert to UTF-8 string
const raw = readFileSync(filePath);
// Node can detect BOM; if not, treat as UTF-16LE
let content = raw.toString('utf16le');
console.log(content.trim());
process.exit(0);

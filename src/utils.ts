import fs from 'fs';
import path from 'path';


export async function readStdin(): Promise<string> {
const chunks: Uint8Array[] = [];
for await (const chunk of process.stdin) chunks.push(chunk);
return Buffer.concat(chunks).toString('utf8');
}


export function isAsciiDocFile(p: string) {
const ext = path.extname(p).toLowerCase();
return ext === '.adoc' || ext === '.asciidoc' || ext === '.ad';
}


export function readFileSyncUtf8(p: string) {
return fs.readFileSync(p, 'utf8');
}
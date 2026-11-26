import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

const assets = [
  ['scripts/assets/inter-latin-wght-normal.woff2.b64', 'public/fonts/inter-latin-wght-normal.woff2'],
  ['scripts/assets/manrope.woff2.b64', 'public/fonts/manrope.woff2'],
  ['scripts/assets/space-grotesk.woff2.b64', 'public/fonts/space-grotesk.woff2'],
  ['scripts/assets/social-preview.png.b64', 'public/social-preview.png'],
];

for (const [from, to] of assets) {
  const dest = join(root, to);
  await mkdir(dirname(dest), { recursive: true });
  const buf = Buffer.from(await readFile(join(root, from), 'utf8'), 'base64');
  await writeFile(dest, buf);
  console.log(`decoded ${to} (${buf.length} bytes)`);
}

import { mkdir, cp, writeFile, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { templates, makeTemplate } from '../src/templates.js';
import { validateDocument, node, page, document } from '../src/model.js';
import { exampleModel, projectModel, disposeModel } from '../src/studio3d.js';
const out = resolve('artifacts/release/DreamEditor-Prototype-0.1');
await mkdir(out, { recursive: true });
// This directory contains only the generated release, never user projects.
await rm(resolve(out, 'dist'), { recursive: true, force: true });
await cp('dist', resolve(out, 'dist'), { recursive: true });
await mkdir(resolve(out, 'scripts'), { recursive: true });
await cp('scripts/serve.mjs', resolve(out, 'scripts/serve.mjs'));
await writeFile(resolve(out, 'start.mjs'), "import './scripts/serve.mjs';\n");
await writeFile(
  resolve(out, 'Avvia-Windows.bat'),
  '@echo off\r\ncd /d "%~dp0"\r\nnode start.mjs --open\r\npause\r\n',
);
await writeFile(
  resolve(out, 'Avvia-Mac.command'),
  '#!/bin/sh\ncd "$(dirname "$0")"\nnode start.mjs --open\n',
  { mode: 0o755 },
);
await writeFile(
  resolve(out, 'Avvia-Linux.sh'),
  '#!/bin/sh\ncd "$(dirname "$0")"\nnode start.mjs --open\n',
  { mode: 0o755 },
);
await mkdir(resolve(out, 'esempi'), { recursive: true });
for (const t of templates)
  await writeFile(
    resolve(out, 'esempi', t.id + '.dream.json'),
    JSON.stringify(validateDocument(makeTemplate(t.id)), null, 2),
  );
const model = exampleModel('vase');
const paths = projectModel(model, { angle: 35, tilt: 15, detail: 'mesh' });
disposeModel(model);
const example = document('Materia — studio tridimensionale', [
  page('Dal volume al segno', '#f4f0e5', [
    node('text', {
      text: 'MATERIA / STUDIO 01',
      x: 50,
      y: 40,
      w: 600,
      h: 30,
      fontSize: 12,
      fontFamily: 'Arial',
    }),
    node('text', { text: 'Il disegno\ndel volume.', x: 50, y: 120, w: 600, h: 160, fontSize: 64 }),
    node('vector', { paths, x: 95, y: 330, w: 530, h: 530, fill: '#9a5a3b', strokeWidth: 1.1 }),
    node('text', {
      text: 'Una proiezione 3D trasformata in segni vettoriali.',
      x: 50,
      y: 900,
      w: 620,
      h: 30,
      fontSize: 15,
    }),
  ]),
]);
await writeFile(
  resolve(out, 'esempi', 'materia-3d.dream.json'),
  JSON.stringify(validateDocument(example), null, 2),
);
await writeFile(
  resolve(out, 'esempi', 'piramide.obj'),
  '# Esempio originale DreamEditor\nv -1 0 -1\nv 1 0 -1\nv 1 0 1\nv -1 0 1\nv 0 2 0\nf 1 2 5\nf 2 3 5\nf 3 4 5\nf 4 1 5\nf 4 3 2 1\n',
);
await cp('docs', resolve(out, 'documentazione'), { recursive: true });
await cp('README.md', resolve(out, 'LEGGIMI.md'));
await cp('THIRD_PARTY_NOTICES.md', resolve(out, 'THIRD_PARTY_NOTICES.md'));
await mkdir(resolve(out, 'anteprime'), { recursive: true });
for (const file of ['editor-desktop.png', 'templates.png', 'studio-3d.png', 'editor-tablet.png']) {
  try {
    await cp(resolve('artifacts', file), resolve(out, 'anteprime', file));
  } catch {}
}
await mkdir(resolve(out, 'sorgenti'), { recursive: true });
for (const name of [
  'src',
  'tests',
  'scripts',
  'docs',
  'public',
  'package.json',
  'package-lock.json',
  'index.html',
  'vite.config.js',
  'playwright.config.js',
  '.gitignore',
  'README.md',
  'THIRD_PARTY_NOTICES.md',
  '.prettierrc.json',
])
  await cp(name, resolve(out, 'sorgenti', name), { recursive: true });
const archive = resolve('artifacts/DreamEditor-Prototype-0.1.zip');
await rm(archive, { force: true });
execFileSync('zip', ['-q', '-r', archive, 'DreamEditor-Prototype-0.1'], {
  cwd: resolve('artifacts/release'),
});
console.log('Pacchetto pronto: ' + archive);

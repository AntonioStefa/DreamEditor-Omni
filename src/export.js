import { renderPage, esc } from './render.js';
export const filename = (name) =>
  (name.replace(/[^\p{L}\p{N}\- _]/gu, '').trim() || 'DreamEditor').slice(0, 70);
export function download(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function exportProject(doc) {
  download(
    new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }),
    filename(doc.name) + '.dream.json',
  );
}
export function exportSVG(page, name) {
  download(
    new Blob([renderPage(page, { prefix: 'export-' })], { type: 'image/svg+xml' }),
    filename(name) + '-' + filename(page.name) + '.svg',
  );
}
export async function exportPNG(page, name) {
  const blob = new Blob([renderPage(page, { prefix: 'png-' })], { type: 'image/svg+xml' }),
    url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 1440, 1920);
    const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!png) throw new Error('Impossibile creare il PNG.');
    download(png, filename(name) + '-' + filename(page.name) + '.png');
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function printDocument(doc) {
  const popup = window.open('', '_blank');
  if (!popup) throw new Error('Consenti le finestre popup per aprire la stampa.');
  popup.document.write(
    `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${esc(doc.name)}</title><style>@page{size:180mm 240mm;margin:0}*{box-sizing:border-box}body{margin:0;background:#d6d6d0;font-family:Arial}header{padding:20px;text-align:center}button{padding:12px 24px;cursor:pointer}article{width:180mm;height:240mm;margin:20px auto;background:white;break-after:page}article:last-child{break-after:auto}svg{width:100%;height:100%;display:block}@media print{body{background:white}header{display:none}article{margin:0;page-break-inside:avoid}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body><header><button id="print">Stampa / Salva come PDF</button><p>Formato 180 × 240 mm · Scala 100% · Disattiva intestazioni e piè di pagina del browser.</p><small>PDF per lettura e stampa domestica. Nessuna certificazione PDF/X o conversione CMYK.</small></header>${doc.pages.map((p, i) => `<article>${renderPage(p, { prefix: 'print' + i })}</article>`).join('')}</body></html>`,
  );
  popup.document.close();
  popup.document.getElementById('print').addEventListener('click', () => popup.print());
  return popup;
}

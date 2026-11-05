import { PAGE_W, PAGE_H } from './model.js';
export const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c],
  );
let context;
function measure(text, n) {
  if (!context && typeof document !== 'undefined')
    context = document.createElement('canvas').getContext('2d');
  if (!context) return text.length * n.fontSize * 0.56;
  context.font = `${n.weight} ${n.fontSize}px "${n.fontFamily}"`;
  return context.measureText(text).width;
}
export function textLines(n) {
  const lines = [];
  for (const para of n.text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      if (measure((line ? line + ' ' : '') + word, n) <= n.w) {
        line += (line ? ' ' : '') + word;
        continue;
      }
      if (line) {
        lines.push(line);
        line = '';
      }
      for (const char of word) {
        if (line && measure(line + char, n) > n.w) {
          lines.push(line);
          line = '';
        }
        line += char;
      }
    }
    lines.push(line);
  }
  return lines;
}
export function overflow(n) {
  return n.type === 'text' && textLines(n).length * n.fontSize * 1.22 > n.h;
}
function shape(kind, w, h, attrs = '') {
  if (kind === 'ellipse')
    return `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" ${attrs}/>`;
  if (kind === 'diamond')
    return `<path d="M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z" ${attrs}/>`;
  if (kind === 'arch')
    return `<path d="M 0 ${h} V ${Math.min(h, w / 2)} Q 0 0 ${w / 2} 0 Q ${w} 0 ${w} ${Math.min(h, w / 2)} V ${h} Z" ${attrs}/>`;
  if (kind === 'organic')
    return `<path d="M ${w * 0.45} 0 C ${w * 0.92} ${-h * 0.04} ${w * 1.1} ${h * 0.33} ${w * 0.94} ${h * 0.65} C ${w * 0.9} ${h * 1.08} ${w * 0.4} ${h * 1.04} ${w * 0.14} ${h * 0.85} C ${-w * 0.12} ${h * 0.66} ${-w * 0.04} ${h * 0.08} ${w * 0.45} 0 Z" ${attrs}/>`;
  return `<rect width="${w}" height="${h}" ${attrs}/>`;
}
export function illustration(kind, color = '#e36d42') {
  if (kind === 'landscape')
    return `<rect width="500" height="600" fill="#ddd9cb"/><circle cx="350" cy="145" r="70" fill="${color}"/><path d="M0 410Q120 180 270 385T500 300V600H0Z" fill="#858f78"/><path d="M0 500Q180 350 340 460T500 400V600H0Z" fill="#3e5449"/><path d="M0 565Q210 460 500 530V600H0Z" fill="#263e35"/>`;
  if (kind === 'orbit')
    return `<rect width="500" height="600" fill="#e8e0ce"/><circle cx="250" cy="300" r="180" fill="${color}"/><path d="M30 430L250 80L470 430Z" fill="#293b33"/>${Array.from({ length: 12 }, (_, i) => `<ellipse cx="250" cy="300" rx="${70 + i * 12}" ry="${180 - i * 9}" fill="none" stroke="#f5ead6" stroke-width="1.3" transform="rotate(-25 250 300)"/>`).join('')}<circle cx="357" cy="160" r="33" fill="#f4cf72"/>`;
  if (kind === 'ink')
    return `<rect width="500" height="600" fill="#eae4d8"/>${Array.from({ length: 36 }, (_, i) => `<path d="M ${45 + i * 7} 520 C ${460 - i * 6} ${450 - i * 6} ${40 + i * 7} ${140 + i * 3} ${400 - i * 5} 65" fill="none" stroke="${color}" stroke-width="${1 + (i % 3)}" opacity="${0.3 + (i % 6) * 0.1}"/>`).join('')}`;
  return `<rect width="500" height="600" fill="#e9e5d8"/><circle cx="350" cy="160" r="95" fill="#ded8c4"/><path d="M245 600Q250 360 300 90M258 430Q145 340 100 220M270 320Q380 290 430 200" fill="none" stroke="#344b39" stroke-width="5"/>${[
    [275, 140, -25],
    [265, 240, -30],
    [248, 350, -40],
    [210, 390, -65],
    [150, 310, -65],
    [330, 290, 45],
    [390, 235, 50],
    [245, 480, -65],
  ]
    .map(
      ([x, y, a], i) =>
        `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0Q-85 -65 0 -150Q75 -70 0 0Z" fill="${i % 3 === 0 ? color : i % 2 ? '#778365' : '#394f3c'}"/><path d="M0 0V-135" stroke="#ddd6bc" stroke-width="1" fill="none"/>${[30, 55, 80].map((v) => `<path d="M0 -${v}L-25 -${v + 22}M0 -${v + 10}L25 -${v + 30}" stroke="#ddd6bc" stroke-width=".8" opacity=".6"/>`).join('')}</g>`,
    )
    .join('')}`;
}
export function renderNode(n, prefix = '') {
  const w = n.w,
    h = n.h,
    id = prefix + n.id;
  const common = `fill="${n.fill}" font-family="${esc(n.fontFamily)}" font-size="${n.fontSize}" font-weight="${n.weight}"`;
  let body = '';
  if (n.type === 'shape') body = shape(n.shape, w, h, `fill="${n.fill}"`);
  if (n.type === 'text') {
    const anchor = n.align === 'center' ? 'middle' : n.align === 'right' ? 'end' : 'start';
    const x = n.align === 'center' ? w / 2 : n.align === 'right' ? w : 0;
    body = `<defs><clipPath id="t${id}"><rect width="${w}" height="${h}"/></clipPath></defs><text ${common} text-anchor="${anchor}" clip-path="url(#t${id})">${textLines(
      n,
    )
      .map((l, i) => `<tspan x="${x}" y="${n.fontSize + i * n.fontSize * 1.22}">${esc(l)}</tspan>`)
      .join('')}</text>`;
  }
  if (n.type === 'curve')
    body = `<defs><path id="p${id}" d="M 4 ${h / 2} Q ${w * 0.25} ${h / 2 - n.curve} ${w * 0.5} ${h / 2} T ${w - 4} ${h / 2}"/></defs><text ${common}><textPath href="#p${id}" startOffset="50%" text-anchor="middle">${esc(n.text)}</textPath></text>`;
  if (n.type === 'image' || n.type === 'art') {
    body = `<defs><clipPath id="c${id}">${shape(n.mask, w, h)}</clipPath></defs><g clip-path="url(#c${id})">`;
    body +=
      n.type === 'image' && n.source
        ? `<image href="${esc(n.source)}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`
        : `<svg width="${w}" height="${h}" viewBox="0 0 500 600" preserveAspectRatio="xMidYMid slice">${illustration(n.art, n.fill)}</svg>`;
    body += '</g>';
  }
  if (n.type === 'chart') {
    const max = Math.max(1, ...n.values),
      step = w / n.values.length;
    body =
      `<line x1="0" y1="${h - 25}" x2="${w}" y2="${h - 25}" stroke="#b9b8ac"/>` +
      n.values
        .map((v, i) => {
          const bh = ((h - 55) * v) / max;
          return `<rect x="${i * step + step * 0.12}" y="${h - 25 - bh}" width="${step * 0.64}" height="${bh}" rx="3" fill="${n.fill}" opacity="${0.45 + (0.55 * (i + 1)) / n.values.length}"/><text x="${i * step + step * 0.44}" y="${h - 33 - bh}" text-anchor="middle" font-family="Arial" font-size="12" fill="${n.stroke}">${v}</text><text x="${i * step + step * 0.44}" y="${h - 7}" text-anchor="middle" font-family="Arial" font-size="11" fill="${n.stroke}">${i + 1}</text>`;
        })
        .join('');
  }
  if (n.type === 'vector')
    body = `<svg width="${w}" height="${h}" viewBox="0 0 500 500">${n.paths.map((p) => `<path d="${esc(p)}" fill="none" stroke="${n.fill}" stroke-width="${n.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;
  return `<g data-node="${esc(n.id)}" transform="translate(${n.x} ${n.y}) rotate(${n.rotation} ${w / 2} ${h / 2})" opacity="${n.opacity}">${body}</g>`;
}
export function renderPage(
  p,
  { prefix = '', interactive = false, selected = null, grid = false } = {},
) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${PAGE_W} ${PAGE_H}" width="${PAGE_W}" height="${PAGE_H}" class="page-svg" role="img" aria-label="${esc(p.name)}"><defs><pattern id="grid${prefix}" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="1" fill="#444" opacity=".18"/></pattern></defs><rect width="720" height="960" fill="${p.background}"/>${p.nodes.map((n) => renderNode(n, prefix)).join('')}${grid ? `<rect width="720" height="960" fill="url(#grid${prefix})" pointer-events="none"/><rect x="54" y="54" width="612" height="852" fill="none" stroke="#c27b4c" stroke-dasharray="5 5" opacity=".5" pointer-events="none"/>` : ''}${interactive ? p.nodes.map((n) => `<rect data-hit="${n.id}" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" transform="rotate(${n.rotation} ${n.x + n.w / 2} ${n.y + n.h / 2})" fill="transparent" style="cursor:move"/>`).join('') : ''}${interactive && selected ? selection(p.nodes.find((n) => n.id === selected)) : ''}</svg>`;
}
function selection(n) {
  if (!n) return '';
  return `<g transform="translate(${n.x} ${n.y}) rotate(${n.rotation} ${n.w / 2} ${n.h / 2})"><rect width="${n.w}" height="${n.h}" fill="none" stroke="#d66b42" stroke-width="1.5" pointer-events="none"/>${[
    [0, 0],
    [n.w, 0],
    [0, n.h],
    [n.w, n.h],
  ]
    .map(
      ([x, y], i) =>
        `<rect ${i === 3 ? `data-resize="${n.id}"` : ''} x="${x - 5}" y="${y - 5}" width="10" height="10" fill="#fff" stroke="#d66b42" stroke-width="1.5" style="cursor:${i === 3 ? 'nwse-resize' : 'default'}"/>`,
    )
    .join('')}</g>`;
}

export const VERSION = 1;
export const PAGE_W = 720,
  PAGE_H = 960;
export const uid = () => globalThis.crypto.randomUUID();
export const clone = (value) => structuredClone(value);
export const TYPES = ['text', 'curve', 'shape', 'image', 'chart', 'art', 'vector'];
export const FONTS = ['Georgia', 'Arial', 'Courier New'];
export function node(type, props = {}) {
  return {
    id: uid(),
    type,
    x: 70,
    y: 100,
    w: 280,
    h: 160,
    rotation: 0,
    opacity: 1,
    fill: '#242722',
    stroke: '#242722',
    strokeWidth: 1.5,
    fontSize: 32,
    fontFamily: 'Georgia',
    weight: 'normal',
    align: 'left',
    text: 'Una nuova idea',
    shape: 'rect',
    mask: 'rect',
    source: '',
    art: 'botanical',
    values: [34, 68, 48, 90, 62],
    curve: 50,
    paths: [],
    ...props,
  };
}
export function page(name = 'Nuova pagina', background = '#f8f5ee', nodes = []) {
  return { id: uid(), name, background, nodes };
}
export function document(name, pages) {
  return { version: VERSION, name, pages };
}
export const blank = () => document('Senza titolo', [page()]);
export function validateDocument(input) {
  const fail = (message) => {
    throw new Error(message);
  };
  if (!input || input.version !== VERSION)
    fail('Formato progetto non supportato (richiesta versione 1).');
  if (typeof input.name !== 'string' || input.name.length > 160) fail('Nome documento non valido.');
  if (!Array.isArray(input.pages) || !input.pages.length || input.pages.length > 60)
    fail('Sono consentite da 1 a 60 pagine.');
  const ids = new Set();
  const id = (v) => {
    if (typeof v !== 'string' || !/^[\w-]{1,80}$/.test(v) || ids.has(v))
      fail('Identificatori non validi o duplicati.');
    ids.add(v);
    return v;
  };
  const color = (v) => {
    if (!/^#[0-9a-f]{6}$/i.test(v)) fail('Colore non valido.');
    return v;
  };
  const number = (v, min, max) => {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max)
      fail('Dimensione o valore numerico non valido.');
    return v;
  };
  let total = 0;
  const pages = input.pages.map((p) => {
    if (
      !p ||
      typeof p.name !== 'string' ||
      p.name.length > 120 ||
      !Array.isArray(p.nodes) ||
      p.nodes.length > 300
    )
      fail('Pagina non valida.');
    return {
      id: id(p.id),
      name: p.name,
      background: color(p.background),
      nodes: p.nodes.map((n) => {
        if (!n || !TYPES.includes(n.type)) fail('Tipo elemento non supportato.');
        const out = node(n.type);
        out.id = id(n.id);
        for (const k of ['x', 'y']) out[k] = number(n[k], -10000, 10000);
        for (const k of ['w', 'h']) out[k] = number(n[k], 1, 10000);
        out.rotation = number(n.rotation, -3600, 3600);
        out.opacity = number(n.opacity, 0, 1);
        out.fill = color(n.fill);
        out.stroke = color(n.stroke);
        out.strokeWidth = number(n.strokeWidth, 0, 50);
        out.fontSize = number(n.fontSize, 8, 300);
        if (
          !FONTS.includes(n.fontFamily) ||
          !['normal', 'bold'].includes(n.weight) ||
          !['left', 'center', 'right'].includes(n.align)
        )
          fail('Stile tipografico non supportato.');
        out.fontFamily = n.fontFamily;
        out.weight = n.weight;
        out.align = n.align;
        if (typeof n.text !== 'string' || n.text.length > 30000) fail('Testo troppo lungo.');
        out.text = n.text;
        for (const k of ['shape', 'mask']) {
          if (!['rect', 'ellipse', 'arch', 'diamond', 'organic'].includes(n[k]))
            fail('Forma non supportata.');
          out[k] = n[k];
        }
        if (
          typeof n.source !== 'string' ||
          n.source.length > 12000000 ||
          (n.source && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(n.source))
        )
          fail('Immagine non valida: usa PNG, JPEG o WebP.');
        total += n.source.length;
        out.source = n.source;
        if (!['botanical', 'orbit', 'landscape', 'ink'].includes(n.art))
          fail('Illustrazione non supportata.');
        out.art = n.art;
        if (!Array.isArray(n.values) || !n.values.length || n.values.length > 24)
          fail('Dati del grafico non validi.');
        out.values = n.values.map((v) => number(v, 0, 1000000));
        out.curve = number(n.curve, -200, 200);
        if (!Array.isArray(n.paths) || n.paths.length > 15000) fail('Disegno troppo complesso.');
        out.paths = n.paths.map((s) => {
          if (
            typeof s !== 'string' ||
            s.length > 2000 ||
            !/^[MLCZQAHVSTmlczqahvst0-9., eE+\-]+$/.test(s)
          )
            fail('Tracciato non valido.');
          return s;
        });
        return out;
      }),
    };
  });
  if (total > 20000000) fail('Le immagini del progetto superano 20 MB.');
  return document(input.name, pages);
}
export class History {
  constructor(value) {
    this.current = clone(value);
    this.past = [];
    this.future = [];
  }
  commit(value) {
    if (JSON.stringify(value) === JSON.stringify(this.current)) return false;
    this.past.push(this.current);
    if (this.past.length > 30) this.past.shift();
    this.current = clone(value);
    this.future = [];
    return true;
  }
  undo() {
    if (this.past.length) {
      this.future.push(this.current);
      this.current = this.past.pop();
    }
    return clone(this.current);
  }
  redo() {
    if (this.future.length) {
      this.past.push(this.current);
      this.current = this.future.pop();
    }
    return clone(this.current);
  }
}
export function layoutFrames(mode, margin = 54, gap = 20) {
  const w = PAGE_W - 2 * margin,
    h = PAGE_H - 2 * margin;
  if (mode === 'columns')
    return [0, 1, 2].map((i) => ({
      x: margin + (i * (w + gap)) / 3,
      y: margin,
      w: (w - 2 * gap) / 3,
      h,
    }));
  if (mode === 'golden') {
    const first = (h - gap) * 0.618;
    return [
      { x: margin, y: margin, w, h: first },
      { x: margin, y: margin + first + gap, w: (w - gap) / 2, h: h - first - gap },
      { x: margin + (w + gap) / 2, y: margin + first + gap, w: (w - gap) / 2, h: h - first - gap },
    ];
  }
  return [0, 1, 2, 3].map((i) => ({
    x: margin + ((i % 2) * (w + gap)) / 2,
    y: margin + (Math.floor(i / 2) * (h + gap)) / 2,
    w: (w - gap) / 2,
    h: (h - gap) / 2,
  }));
}
export function duplicateNode(n) {
  return { ...clone(n), id: uid(), x: n.x + 18, y: n.y + 18 };
}

import './style.css';
import {
  createIcons,
  MousePointer2,
  Type,
  ImagePlus,
  Shapes,
  LayoutTemplate,
  Layers,
  Plus,
  Minus,
  Undo2,
  Redo2,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Grid2X2,
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  CheckCheck,
  Save,
  FilePlus,
  PanelLeftClose,
  Box,
  ChartNoAxesColumn,
  Flower2,
  Spline,
  X,
  Maximize,
  SlidersHorizontal,
  BookOpen,
  ArrowRight,
  HelpCircle,
  RotateCcw,
  FileJson,
  Printer,
  Image,
  Square,
  ExternalLink,
} from 'lucide';
import {
  node,
  page,
  blank,
  clone,
  History,
  validateDocument,
  layoutFrames,
  duplicateNode,
  uid,
  FONTS,
} from './model.js';
import { renderPage, illustration, esc, overflow } from './render.js';
import { templates, makeTemplate } from './templates.js';
import { readLocal, writeLocal } from './storage.js';
import { exportProject, exportSVG, exportPNG, printDocument } from './export.js';
const icons = {
  MousePointer2,
  Type,
  ImagePlus,
  Shapes,
  LayoutTemplate,
  Layers,
  Plus,
  Minus,
  Undo2,
  Redo2,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Grid2X2,
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  CheckCheck,
  Save,
  FilePlus,
  PanelLeftClose,
  Box,
  ChartNoAxesColumn,
  Flower2,
  Spline,
  X,
  Maximize,
  SlidersHorizontal,
  BookOpen,
  ArrowRight,
  HelpCircle,
  RotateCcw,
  FileJson,
  Printer,
  Image,
  Square,
  ExternalLink,
};
icons.Grid2x2 = Grid2X2;
const icon = (name, size = 18) =>
  `<i data-lucide="${name}" width="${size}" height="${size}" aria-hidden="true"></i>`;
const $ = (s) => document.querySelector(s);
const label = {
  text: 'Testo',
  curve: 'Titolo su curva',
  shape: 'Forma',
  image: 'Immagine',
  chart: 'Grafico',
  art: 'Illustrazione',
  vector: 'Disegno 3D',
};
let doc = makeTemplate('botanica'),
  restored = false,
  restoreProblem = '';
try {
  const local = await readLocal();
  if (local) {
    doc = validateDocument(local);
    restored = true;
  }
} catch (e) {
  restoreProblem = e.message;
  console.warn('Ripristino locale:', e.message);
}
let history = new History(doc),
  pageId = doc.pages[0].id,
  selected = null,
  tab = 'elements',
  zoom = 0.65,
  grid = false,
  filter = 'Tutti',
  saveTimer,
  toastTimer,
  modalReturnFocus,
  studio = null;
const currentPage = () => doc.pages.find((p) => p.id === pageId) || doc.pages[0];
const currentNode = () => currentPage().nodes.find((n) => n.id === selected);
function hydrate() {
  createIcons({ icons, attrs: { 'stroke-width': 1.65 } });
}
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4000);
}
function status(text) {
  $('#save-status').innerHTML =
    icon(text === 'Salvato in locale' ? 'check-check' : 'save', 13) + `<span>${esc(text)}</span>`;
  hydrate();
}
function save() {
  clearTimeout(saveTimer);
  status('Salvataggio…');
  saveTimer = setTimeout(async () => {
    try {
      await writeLocal(clone(doc));
      status('Salvato in locale');
    } catch {
      status('Salvataggio non riuscito');
      toast('Spazio locale non disponibile. Scarica il progetto per conservarlo.');
    }
  }, 350);
}
function commit() {
  try {
    doc = validateDocument(doc);
  } catch (error) {
    doc = clone(history.current);
    syncSelection();
    render();
    toast(error.message);
    return false;
  }
  history.commit(doc);
  syncSelection();
  render();
  save();
}
function syncSelection() {
  if (!doc.pages.some((p) => p.id === pageId)) pageId = doc.pages[0].id;
  if (!currentPage().nodes.some((n) => n.id === selected)) selected = null;
}
function replaceDocument(next) {
  doc = next;
  history = new History(doc);
  pageId = doc.pages[0].id;
  selected = null;
  closeModal();
  render();
  fit();
  save();
}
function addNode(n) {
  $('.library-panel').classList.remove('mobile-open');
  if (currentPage().nodes.length >= 300) {
    toast('Limite del prototipo: 300 elementi per pagina.');
    return;
  }
  currentPage().nodes.push(n);
  selected = n.id;
  commit();
}
function button(action, name, title, extra = '') {
  return `<button class="icon-button" data-action="${action}" title="${title}" aria-label="${title}" ${extra}>${icon(name)}</button>`;
}
$('#app').innerHTML = `
<header class="topbar"><a class="brand" href="#" aria-label="DreamEditor, guida" data-action="help"><span class="brand-mark">d<span>✳</span></span><span>dreameditor<span class="brand-caption">CREATIVE STUDIO</span></span></a><div class="document-meta"><input id="document-name" aria-label="Nome del progetto" maxlength="160"><div id="save-status"></div></div><div class="top-actions"><span class="prototype-badge">STUDIO / 01</span>${button('undo', 'undo-2', 'Annulla (Ctrl+Z)')}${button('redo', 'redo-2', 'Ripeti (Ctrl+Shift+Z)')}<span class="divider"></span><button class="quiet-button" data-action="open">${icon('folder-open' in icons ? 'folder-open' : 'upload', 16)}<span>Apri</span></button><button class="quiet-button" data-action="save">${icon('save', 16)}<span>Salva progetto</span></button><button class="primary-button" data-action="export">Esporta ${icon('arrow-up-right', 16)}</button></div></header>
<div class="app-body"><nav class="tool-rail" aria-label="Strumenti"><button class="rail-tool active" data-tab="elements" title="Elementi">${icon('shapes', 21)}<span>Elementi</span></button><button class="rail-tool" data-action="templates" title="Template">${icon('layout-template', 21)}<span>Template</span></button><button class="rail-tool" data-action="image" title="Importa immagine">${icon('image-plus', 21)}<span>Immagini</span></button><button class="rail-tool" data-action="studio" title="Studio 3D">${icon('box', 21)}<span>Studio 3D</span></button><button class="rail-tool" data-tab="layers" title="Livelli">${icon('layers', 21)}<span>Livelli</span></button><div class="rail-bottom"><button class="rail-tool" data-action="help" title="Guida">${icon('help-circle', 20)}<span>Guida</span></button><div class="avatar">DE</div></div></nav>
<aside class="library-panel" aria-label="Libreria creativa"><button class="library-close icon-button" data-action="close-library" aria-label="Chiudi tavolozza">${icon('x', 18)}</button><div id="library"></div><div class="library-footer"><span class="live-dot"></span>Tutto il tuo spazio creativo.</div></aside>
<main class="workspace"><div class="workspace-toolbar"><div class="breadcrumb">Progetto <span>/</span> <strong id="page-label"></strong></div><div class="canvas-tools"><button class="quiet-button small" data-action="layout">${icon('grid-2x2', 15)}<span>Proporzioni</span></button>${button('grid', 'grid-2x2', 'Mostra griglia e aggancio')}${button('fit', 'maximize', 'Adatta la pagina')}</div></div><div class="canvas-viewport" id="viewport"><div class="page-caption"><span id="canvas-caption"></span><span>180 × 240 mm</span></div><div id="stage" tabindex="0" aria-label="Pagina di lavoro"></div><div class="canvas-hint">Uno spazio per le tue idee. <span>Seleziona un elemento per iniziare.</span></div></div><div class="pages-bar"><div id="page-thumbnails"></div><button class="add-page" data-action="add-page" title="Aggiungi pagina" aria-label="Aggiungi pagina">${icon('plus', 18)}</button><div class="zoom-controls">${button('zoom-out', 'minus', 'Riduci zoom')}<button class="zoom-value" data-action="fit" id="zoom-label">65%</button>${button('zoom-in', 'plus', 'Aumenta zoom')}</div></div></main>
<aside class="inspector" aria-label="Proprietà"><div class="inspector-heading"><span>Proprietà</span>${icon('sliders-horizontal', 17)}</div><div id="inspector-content"></div><div class="inspector-foot">CREA CON INTENZIONE.<br><span>Lascia spazio all’inaspettato.</span></div></aside></div>
<div id="toast" role="status" aria-live="polite"></div><dialog id="modal" aria-labelledby="modal-title"></dialog><input type="file" id="project-file" accept=".json,.dream.json" hidden><input type="file" id="image-file" accept="image/png,image/jpeg,image/webp" hidden><input type="file" id="obj-file" accept=".obj" hidden>`;
function render() {
  $('#document-name').value = doc.name;
  $('#page-label').textContent = currentPage().name;
  $('#canvas-caption').textContent =
    String(doc.pages.indexOf(currentPage()) + 1).padStart(2, '0') +
    ' — ' +
    currentPage().name.replace(/^\d+\s*—\s*/, '');
  $('[data-action="undo"]').disabled = !history.past.length;
  $('[data-action="redo"]').disabled = !history.future.length;
  $('[data-action="grid"]').classList.toggle('active', grid);
  renderCanvas();
  renderLibrary();
  renderInspector();
  renderPages();
  hydrate();
}
function renderCanvas() {
  const stage = $('#stage');
  stage.style.width = `${720 * zoom}px`;
  stage.style.height = `${960 * zoom}px`;
  stage.innerHTML = renderPage(currentPage(), {
    prefix: 'editor-',
    interactive: true,
    selected,
    grid,
  });
  $('#zoom-label').textContent = Math.round(zoom * 100) + '%';
}
function renderPages() {
  $('#page-thumbnails').innerHTML = doc.pages
    .map(
      (p, i) =>
        `<button class="page-thumb ${p.id === pageId ? 'active' : ''}" data-page="${p.id}" aria-label="Page ${i + 1} : ${esc(p.name)}" title="${esc(p.name)}"><div>${renderPage(p, { prefix: 'thumb-' + i })}</div><span>${String(i + 1).padStart(2, '0')}</span></button>`,
    )
    .join('');
}
function renderLibrary() {
  document
    .querySelectorAll('[data-tab]')
    .forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'layers') {
    $('#library').innerHTML =
      `<div class="panel-title"><h2>Livelli</h2><span>${currentPage().nodes.length}</span></div><p class="panel-intro">L’ordine delle tue idee.<br>Il livello più alto è in primo piano.</p><div class="layer-list">${
        [...currentPage().nodes]
          .reverse()
          .map(
            (n) =>
              `<button class="layer-row ${selected === n.id ? 'selected' : ''}" data-select="${n.id}">${icon(n.type === 'text' ? 'type' : n.type === 'curve' ? 'spline' : n.type === 'image' ? 'image' : 'shapes', 15)}<span>${esc(['text', 'curve'].includes(n.type) ? n.text.slice(0, 30) : label[n.type])}</span></button>`,
          )
          .join('') ||
        '<p class="empty-note">La pagina è un nuovo inizio.<br>Aggiungi il primo elemento.</p>'
      }</div>`;
    hydrate();
    return;
  }
  $('#library').innerHTML =
    `<div class="panel-title"><h2>La tua tavolozza</h2><span>✳</span></div><p class="panel-intro">Forme, parole e possibilità.<br>Comincia da un piccolo segno.</p><div class="section-title">TIPOGRAFIA</div><button class="text-preset headline" data-action="add-title"><span>Aa</span><div>Aggiungi un titolo<small>Una voce, un carattere.</small></div>${icon('plus', 15)}</button><button class="text-preset" data-action="add-text"><span class="paragraph-icon">Tt</span><div>Corpo del testo<small>Le parole prendono spazio.</small></div>${icon('plus', 15)}</button><button class="curve-card" data-action="add-curve"><svg viewBox="0 0 200 55"><defs><path id="sample-wave" d="M12 35Q60 0 105 29T190 28"/></defs><text fill="#76533d" font-size="17" font-family="Georgia"><textPath href="#sample-wave" startOffset="50%" text-anchor="middle">segui la tua ispirazione</textPath></text></svg><span>Testo su un percorso ${icon('arrow-up-right', 14)}</span></button><div class="section-title">FORME ESSENZIALI</div><div class="shape-grid">${['rect', 'ellipse', 'arch', 'diamond'].map((s, i) => `<button data-shape="${s}" aria-label="Aggiungi ${['rettangolo', 'cerchio', 'arco', 'rombo'][i]}" title="${['Rettangolo', 'Cerchio', 'Arco', 'Rombo'][i]}"><span class="shape-sample ${s}"></span></button>`).join('')}</div><div class="section-title spaced"><span>ILLUSTRAZIONI</span><span class="mini-label">VETTORIALI</span></div><div class="art-grid">${['botanical', 'orbit', 'landscape', 'ink'].map((a, i) => `<button data-art="${a}" title="Inserisci ${['Botanica', 'Orbita', 'Paesaggio', 'China'][i]}"><svg viewBox="0 0 500 600">${illustration(a, a === 'ink' ? '#546c68' : '#bd7956')}</svg><span>${['Botanica', 'Orbita', 'Paesaggio', 'China'][i]}</span></button>`).join('')}</div><button class="wide-button" data-action="add-chart">${icon('chart-no-axes-column', 17)} Grafico dai tuoi dati ${icon('plus', 15)}</button><button class="studio-promo" data-action="studio"><div class="promo-icon">${icon('box', 26)}</div><div><strong>Una nuova dimensione</strong><span>Dal 3D al segno vettoriale</span></div>${icon('arrow-up-right', 15)}</button>`;
  hydrate();
}
function field(label, key, value, { type = 'number', min, max, step = 1 } = {}) {
  return `<label class="field"><span>${label}</span><input data-prop="${key}" type="${type}" value="${esc(value)}" ${min !== undefined ? `min="${min}"` : ''} ${max !== undefined ? `max="${max}"` : ''} step="${step}"></label>`;
}
function selectField(title, key, value, options) {
  return `<label class="field full"><span>${title}</span><select data-prop="${key}">${options.map(([v, l]) => `<option value="${v}" ${v === value ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
}
function renderInspector() {
  const n = currentNode();
  const p = currentPage();
  if (!n) {
    $('#inspector-content').innerHTML =
      `<div class="selection-heading"><span class="selection-icon">${icon('book-open', 21)}</span><div><h3>La tua pagina</h3><small>Una tela di possibilità</small></div></div><section class="property-section"><h4>DOCUMENTO</h4><label class="field full"><span>Nome della pagina</span><input id="page-name" value="${esc(p.name)}" maxlength="120"></label><div class="dimensions"><span>180 <small>mm</small></span><span>×</span><span>240 <small>mm</small></span></div><label class="color-field"><input type="color" id="page-color" value="${p.background}"><span>Sfondo pagina</span><code>${p.background.toUpperCase()}</code></label></section><section class="property-section"><h4>COMPOSIZIONE</h4><button class="wide-button" data-action="layout">${icon('grid-2x2', 16)} Cornici proporzionate ${icon('arrow-right', 15)}</button><p class="help-copy">Costruisci un equilibrio con griglie e proporzioni modificabili.</p></section><section class="property-section"><h4>PALETTE DELLO STUDIO</h4><div class="palette">${['#f5f2e9', '#273f34', '#b36b49', '#e6784e', '#dce5ed', '#242722'].map((c) => `<button data-background="${c}" style="--swatch:${c}" title="Sfondo ${c}" aria-label="Sfondo ${c}"></button>`).join('')}</div></section><section class="property-section"><h4>PAGINA</h4><button class="wide-button" data-action="duplicate-page">${icon('copy', 16)} Duplica pagina</button><button class="wide-button danger-quiet" data-action="delete-page" ${doc.pages.length === 1 ? 'disabled' : ''}>${icon('trash-2', 16)} Elimina pagina</button></section><div class="tip-card"><span>UN PICCOLO SUGGERIMENTO</span><p>Seleziona un elemento nella pagina per cambiarne ogni dettaglio.</p></div>`;
    hydrate();
    return;
  }
  const isText = ['text', 'curve'].includes(n.type);
  $('#inspector-content').innerHTML =
    `<div class="selection-heading"><span class="selection-icon">${icon(isText ? 'type' : n.type === 'vector' ? 'box' : 'shapes', 21)}</span><div><h3>${label[n.type]}</h3><small>Modifica, esplora, riprova.</small></div>${button('deselect', 'x', 'Deseleziona')}</div>${
      isText
        ? `<section class="property-section"><h4>CONTENUTO</h4><textarea data-prop="text" aria-label="Contenuto del testo" rows="4" maxlength="30000">${esc(n.text)}</textarea>${overflow(n) ? '<p class="warning">Il testo supera la cornice. Aumenta l’altezza o riduci il carattere.</p>' : ''}${selectField(
            'Carattere',
            'fontFamily',
            n.fontFamily,
            FONTS.map((f) => [
              f,
              {
                Georgia: 'Georgia · Editoriale',
                Arial: 'Arial · Essenziale',
                'Courier New': 'Courier · Monospazio',
              }[f],
            ]),
          )}<div class="field-grid">${field('Dimensione', 'fontSize', n.fontSize, { min: 8, max: 300 })}${selectField(
            'Peso',
            'weight',
            n.weight,
            [
              ['normal', 'Regolare'],
              ['bold', 'Grassetto'],
            ],
          )}</div>${n.type === 'text' ? `<div class="alignment">${['left', 'center', 'right'].map((a, i) => `<button class="icon-button ${n.align === a ? 'active' : ''}" data-align="${a}" aria-label="Allinea ${['a sinistra', 'al centro', 'a destra'][i]}">${icon('align-' + a, 17)}</button>`).join('')}</div>` : field('Ampiezza dell’onda', 'curve', n.curve, { min: -200, max: 200 })}</section>`
        : ''
    }<section class="property-section"><h4>POSIZIONE E DIMENSIONI</h4><div class="field-grid">${field('X', 'x', Math.round(n.x), { min: -10000, max: 10000 })}${field('Y', 'y', Math.round(n.y), { min: -10000, max: 10000 })}${field('Larghezza', 'w', Math.round(n.w), { min: 10, max: 2000 })}${field('Altezza', 'h', Math.round(n.h), { min: 10, max: 2000 })}</div><div class="field-grid">${field('Rotazione °', 'rotation', n.rotation, { min: -360, max: 360 })}${field('Opacità %', 'opacity', Math.round(n.opacity * 100), { min: 0, max: 100 })}</div><div class="alignment">${button('center-x', 'align-center', 'Centra nella pagina')}</div></section><section class="property-section"><h4>ASPETTO</h4><label class="color-field"><input data-prop="fill" type="color" value="${n.fill}"><span>${n.type === 'image' ? 'Colore elemento' : 'Colore'}</span><code>${n.fill.toUpperCase()}</code></label>${
      ['image', 'art'].includes(n.type)
        ? selectField('Maschera', 'mask', n.mask, [
            ['rect', 'Rettangolo'],
            ['ellipse', 'Cerchio / ovale'],
            ['arch', 'Arco'],
            ['diamond', 'Rombo'],
            ['organic', 'Organica'],
          ])
        : ''
    }${n.type === 'image' ? '<button class="wide-button" data-action="replace-image">Sostituisci immagine</button><p class="help-copy">Ritaglio centrato. Cambia le proporzioni della cornice per modificare il taglio.</p>' : ''}${
      n.type === 'shape'
        ? selectField('Geometria', 'shape', n.shape, [
            ['rect', 'Rettangolo'],
            ['ellipse', 'Ellisse'],
            ['arch', 'Arco'],
            ['diamond', 'Rombo'],
            ['organic', 'Organica'],
          ])
        : ''
    }${n.type === 'vector' ? field('Spessore del segno', 'strokeWidth', n.strokeWidth, { min: 0.1, max: 10, step: 0.1 }) : ''}${n.type === 'chart' ? `<label class="field full"><span>Valori separati da virgola</span><input data-prop="values" value="${n.values.join(', ')}" aria-label="Dati del grafico"></label><p class="help-copy">Fino a 24 valori positivi. Le colonne si adattano automaticamente.</p>` : ''}</section><section class="property-section"><h4>LIVELLO</h4><div class="object-actions">${button('back', 'move-down', 'Sposta indietro')}${button('front', 'move-up', 'Sposta avanti')}${button('duplicate', 'copy', 'Duplica elemento (Ctrl+D)')}${button('delete', 'trash-2', 'Elimina elemento')}</div></section>`;
  hydrate();
}
function fit() {
  const vp = $('#viewport');
  zoom = Math.min(
    0.95,
    Math.max(0.22, Math.min((vp.clientWidth - 100) / 720, (vp.clientHeight - 100) / 960)),
  );
  renderCanvas();
}
function showModal(html, wide = false) {
  const m = $('#modal');
  modalReturnFocus = document.activeElement;
  m.classList.toggle('wide', wide);
  m.innerHTML = html;
  if (!m.open) m.showModal();
  hydrate();
}
function closeModal() {
  const m = $('#modal');
  if (m.open) m.close();
  if (studio) {
    studio.module.disposeModel(studio.model);
    studio = null;
  }
  modalReturnFocus?.focus?.();
}
function modalHeader(eyebrow, title, description = '') {
  return `<div class="modal-heading"><div><span class="eyebrow">${eyebrow}</span><h2 id="modal-title">${title}</h2>${description ? `<p>${description}</p>` : ''}</div>${button('close', 'x', 'Chiudi finestra')}</div>`;
}
function templateModal() {
  showModal(
    `${modalHeader('LA COLLEZIONE DELLO STUDIO', 'Ogni idea ha una forma.', 'Scegli un punto di partenza. Tutto quello che vedi è modificabile.')}<div class="filter-row">${['Tutti', 'Magazine', 'Design', 'Libro', 'Didattica', 'Poster'].map((f) => `<button class="filter-pill ${filter === f ? 'active' : ''}" data-filter="${f}">${f}</button>`).join('')}<button class="filter-pill blank-button" data-action="blank">${icon('plus', 14)} Pagina bianca</button></div><div class="template-grid">${templates
      .filter((t) => filter === 'Tutti' || t.category === filter)
      .map(
        (t) =>
          `<button class="template-card" data-template="${t.id}"><div class="template-preview" style="--template-bg:${t.color}">${renderPage(t.pages[0], { prefix: 'gallery-' + t.id })}<span>Apri template ${icon('arrow-up-right', 16)}</span></div><div class="template-card-info"><small>${t.tag}</small><h3>${t.name}</h3><p>${t.description}</p></div></button>`,
      )
      .join(
        '',
      )}</div><p class="modal-note">Aprire un template crea un nuovo progetto. Puoi scaricare quello attuale prima di sostituirlo.</p>`,
    true,
  );
}
function requestReplacement(next) {
  showModal(
    `${modalHeader('UN NUOVO INIZIO', 'Aprire un nuovo progetto?', 'Il documento attuale verrà sostituito. Scaricalo per conservarne una copia.')}<div class="dialog-actions"><button class="quiet-button" data-action="save">${icon('download', 16)} Scarica progetto attuale</button><button class="primary-button" id="confirm-replace">Apri nuovo progetto ${icon('arrow-right', 16)}</button></div>`,
  );
  $('#confirm-replace').onclick = () => {
    replaceDocument(next);
    toast('Il tuo nuovo spazio creativo è pronto.');
  };
}
function layoutModal() {
  showModal(
    `${modalHeader('EQUILIBRIO, SENZA SFORZO', 'Dai spazio alle idee.', 'Aggiungi cornici proporzionate, pronte per testo e immagini.')}<div class="layout-options">${[
      ['golden', 'Sezione aurea', 'Una parte protagonista, due dettagli.'],
      ['columns', 'Tre colonne', 'Un ritmo editoriale ordinato.'],
      ['modular', 'Griglia modulare', 'Quattro spazi, infinite combinazioni.'],
    ]
      .map(
        ([id, title, desc]) =>
          `<button data-layout="${id}" class="layout-card"><svg viewBox="0 0 720 960">${layoutFrames(
            id,
          )
            .map(
              (f) =>
                `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="8" fill="#d9dfd1"/>`,
            )
            .join('')}</svg><strong>${title}</strong><small>${desc}</small></button>`,
      )
      .join(
        '',
      )}</div><p class="modal-note">Le cornici vengono aggiunte alla pagina corrente. Gli elementi esistenti restano al loro posto. Puoi annullare con Ctrl+Z.</p>`,
  );
}
function exportModal() {
  showModal(
    `${modalHeader('DALL’IDEA AL MONDO', 'Porta con te il progetto.', 'Scegli il formato adatto al prossimo passo.')}<div class="export-options"><button data-action="save">${icon('file-json', 24)}<span><strong>Progetto DreamEditor</strong><small>Tutte le pagine, gli elementi e le immagini. Modificabile.</small></span>${icon('download', 18)}</button><button data-action="svg">${icon('spline', 24)}<span><strong>Pagina in SVG</strong><small>Forme e testi vettoriali; immagini incorporate.</small></span>${icon('download', 18)}</button><button data-action="png">${icon('image', 24)}<span><strong>Pagina in PNG</strong><small>1440 × 1920 pixel. Pronta da condividere.</small></span>${icon('download', 18)}</button><button data-action="print">${icon('printer', 24)}<span><strong>Stampa / PDF</strong><small>Tutte le pagine, tramite il browser. Formato 180 × 240 mm.</small></span>${icon('external-link', 18)}</button></div><p class="modal-note">Il PDF del prototipo è pensato per lettura e stampa domestica: non include CMYK, abbondanze o certificazione PDF/X.</p>`,
  );
}
async function studioModal() {
  showModal(
    `${modalHeader('LABORATORIO CREATIVO', 'Dal volume al segno.', 'Caricamento dello studio 3D…')}<div class="loading-studio">Prepariamo una nuova prospettiva.</div>`,
  );
  try {
    const module = await import('./studio3d.js');
    if (!$('#modal').open) return;
    studio = {
      module,
      model: module.exampleModel(),
      angle: 25,
      tilt: 20,
      detail: 'contours',
      color: '#315344',
      paths: [],
    };
    renderStudio();
  } catch (e) {
    toast('Studio 3D non disponibile: ' + e.message);
    closeModal();
  }
}
function renderStudio() {
  showModal(
    `${modalHeader('LABORATORIO CREATIVO', 'Dal volume al segno.', 'Un modello 3D, una nuova illustrazione vettoriale.')}<div class="studio-layout"><div id="studio-preview"></div><div class="studio-controls"><label class="field full"><span>Oggetto dimostrativo</span><select id="studio-model"><option value="torus">Nodo scultoreo</option><option value="vase">Vaso di rivoluzione</option></select></label><button class="wide-button" data-action="import-obj">${icon('upload', 16)} Importa modello OBJ</button><label class="field full"><span>Rotazione <output id="angle-value">25°</output></span><input id="studio-angle" type="range" min="-180" max="180" value="25"></label><label class="field full"><span>Inclinazione <output id="tilt-value">20°</output></span><input id="studio-tilt" type="range" min="-90" max="90" value="20"></label><label class="field full"><span>Ricetta del segno</span><select id="studio-detail"><option value="contours">Spigoli geometrici</option><option value="mesh">Reticolo completo</option></select></label><label class="color-field"><input id="studio-color" type="color" value="#315344"><span>Colore del tratto</span></label><p class="help-copy">Proiezione ortografica. Le linee posteriori restano visibili: questo è uno stile wireframe, non un disegno con rimozione delle linee nascoste.</p><button class="primary-button full-button" data-action="insert-3d">Inserisci nella pagina ${icon('arrow-right', 16)}</button></div></div><p class="modal-note">OBJ senza materiali · massimo 5 MB / 20.000 vertici e facce. Il risultato è un disegno SVG scalabile.</p>`,
    true,
  );
  updateStudio();
  for (const key of ['angle', 'tilt', 'detail', 'color'])
    $('#studio-' + key).addEventListener('input', (e) => {
      studio[key] = ['angle', 'tilt'].includes(key) ? Number(e.target.value) : e.target.value;
      if ($('#' + key + '-value')) $('#' + key + '-value').textContent = e.target.value + '°';
      updateStudio();
    });
  $('#studio-model').onchange = (e) => {
    studio.module.disposeModel(studio.model);
    studio.model = studio.module.exampleModel(e.target.value);
    updateStudio();
  };
}
function updateStudio() {
  try {
    studio.paths = studio.module.projectModel(studio.model, studio);
    $('#studio-preview').innerHTML =
      `<svg viewBox="0 0 500 500" aria-label="Anteprima vettoriale 3D"><defs><pattern id="studio-grid" width="25" height="25" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#a1a795"/></pattern></defs><rect width="500" height="500" fill="url(#studio-grid)"/>${studio.paths.map((p) => `<path d="${p}" fill="none" stroke="${studio.color}" stroke-width="1.2"/>`).join('')}</svg><span class="studio-count">${studio.paths.length.toLocaleString('it-IT')} segmenti vettoriali · vista ortografica</span>`;
    $('button[data-action="insert-3d"]').disabled = false;
  } catch (e) {
    studio.paths = [];
    $('button[data-action="insert-3d"]').disabled = true;
    $('#studio-preview').innerHTML = '<p class="help-copy">' + esc(e.message) + '</p>';
    toast(e.message);
  }
}
function helpModal() {
  showModal(
    `${modalHeader('BENVENUTO NELLO STUDIO', 'Uno spazio per creare.', 'DreamEditor · Prototipo 0.1')}<div class="help-grid"><section><h3>Componi</h3><p>Aggiungi testi, forme, illustrazioni e grafici dalla tavolozza. Trascina gli elementi e ridimensionali dal quadratino in basso a destra.</p><h3>Trasforma</h3><p>Cambia colori, caratteri e maschere nel pannello Proprietà. Usa Proporzioni per aggiungere cornici equilibrate o Studio 3D per creare disegni wireframe.</p></section><section><h3>Conserva</h3><p>Il progetto si salva automaticamente in questo browser. Scarica anche una copia JSON con “Salva progetto”: potrai riaprirla con “Apri”.</p><h3>Condividi</h3><p>Esporta la pagina in SVG o PNG, oppure tutte le pagine tramite Stampa / PDF. Font locali: il loro aspetto può variare tra dispositivi.</p></section></div><div class="shortcut-row"><span><kbd>Ctrl Z</kbd> Annulla</span><span><kbd>Ctrl ⇧ Z</kbd> Ripeti</span><span><kbd>Ctrl D</kbd> Duplica</span><span><kbd>⌫</kbd> Elimina</span><span><kbd>← ↑ → ↓</kbd> Sposta</span></div><p class="modal-note">Su Mac usa ⌘ al posto di Ctrl. Questo prototipo non comprende ancora testo concatenato, formule, pennelli pittorici e prestampa professionale. Le illustrazioni incluse sono originali e utilizzabili nei tuoi progetti.</p>`,
  );
}
const actions = {
  'close-library': () => $('.library-panel').classList.remove('mobile-open'),
  templates: templateModal,
  layout: layoutModal,
  export: exportModal,
  studio: studioModal,
  help: helpModal,
  close: closeModal,
  undo: () => {
    doc = history.undo();
    syncSelection();
    render();
    save();
  },
  redo: () => {
    doc = history.redo();
    syncSelection();
    render();
    save();
  },
  'add-title': () =>
    addNode(
      node('text', {
        text: 'Una nuova\nprospettiva.',
        w: 540,
        h: 180,
        fontSize: 64,
        x: 70,
        y: 120,
      }),
    ),
  'add-text': () =>
    addNode(
      node('text', {
        text: 'Le idee prendono forma, una parola alla volta. Scrivi qui la tua storia e trova il ritmo giusto per raccontarla.',
        w: 300,
        h: 200,
        fontSize: 20,
        x: 80,
        y: 360,
      }),
    ),
  'add-curve': () =>
    addNode(
      node('curve', {
        text: 'segui la tua immaginazione',
        w: 550,
        h: 160,
        x: 80,
        y: 430,
        fontSize: 29,
        curve: 65,
        fill: '#a05d40',
      }),
    ),
  'add-chart': () => addNode(node('chart', { w: 420, h: 240, x: 120, y: 400, fill: '#557554' })),
  deselect: () => {
    selected = null;
    render();
  },
  delete: () => {
    if (!selected) return;
    currentPage().nodes = currentPage().nodes.filter((n) => n.id !== selected);
    selected = null;
    commit();
  },
  duplicate: () => {
    const n = currentNode();
    if (n) addNode(duplicateNode(n));
  },
  back: () => reorder(-1),
  front: () => reorder(1),
  'center-x': () => {
    const n = currentNode();
    if (n) {
      n.x = (720 - n.w) / 2;
      commit();
    }
  },
  grid: () => {
    grid = !grid;
    render();
    toast(grid ? 'Griglia attiva: spostamenti agganciati ogni 12 unità.' : 'Griglia disattivata.');
  },
  fit: fit,
  'zoom-in': () => {
    zoom = Math.min(2, zoom + 0.1);
    renderCanvas();
  },
  'zoom-out': () => {
    zoom = Math.max(0.2, zoom - 0.1);
    renderCanvas();
  },
  'add-page': () => {
    if (doc.pages.length >= 60) {
      toast('Limite del prototipo: 60 pagine.');
      return;
    }
    const p = page('Pagina ' + (doc.pages.length + 1));
    doc.pages.push(p);
    pageId = p.id;
    selected = null;
    commit();
  },
  'duplicate-page': () => {
    if (doc.pages.length >= 60) {
      toast('Limite del prototipo: 60 pagine.');
      return;
    }
    const p = clone(currentPage());
    p.id = uid();
    p.name = p.name.slice(0, 110) + ' · copia';
    p.nodes.forEach((n) => (n.id = uid()));
    doc.pages.splice(doc.pages.indexOf(currentPage()) + 1, 0, p);
    pageId = p.id;
    selected = null;
    commit();
  },
  'delete-page': () => {
    if (doc.pages.length <= 1) return;
    doc.pages = doc.pages.filter((p) => p.id !== pageId);
    pageId = doc.pages[0].id;
    selected = null;
    commit();
  },
  blank: () => requestReplacement(blank()),
  open: () => $('#project-file').click(),
  save: () => {
    exportProject(doc);
    toast('Progetto scaricato. Puoi riaprirlo con “Apri”.');
  },
  svg: () => {
    exportSVG(currentPage(), doc.name);
    toast('Pagina SVG scaricata.');
  },
  png: async () => {
    try {
      await exportPNG(currentPage(), doc.name);
      toast('Pagina PNG scaricata.');
    } catch (e) {
      toast(e.message);
    }
  },
  print: () => {
    try {
      printDocument(doc);
    } catch (e) {
      toast(e.message);
    }
  },
  image: () => {
    replaceImageId = null;
    $('#image-file').click();
  },
  'replace-image': () => {
    replaceImageId = selected;
    $('#image-file').click();
  },
  'import-obj': () => $('#obj-file').click(),
  'insert-3d': () => {
    if (!studio?.paths.length) return;
    const n = node('vector', {
      paths: clone(studio.paths),
      x: 110,
      y: 220,
      w: 500,
      h: 500,
      fill: studio.color,
      strokeWidth: 1.2,
    });
    closeModal();
    addNode(n);
    toast('Disegno vettoriale inserito. Colore e dimensioni restano modificabili.');
  },
};
function reorder(direction) {
  const nodes = currentPage().nodes,
    i = nodes.findIndex((n) => n.id === selected),
    j = i + direction;
  if (i < 0 || j < 0 || j >= nodes.length) return;
  [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
  commit();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button,[data-action]');
  if (!b || b.disabled) return;
  if (b.dataset.action) {
    e.preventDefault();
    actions[b.dataset.action]?.();
    return;
  }
  if (b.dataset.tab) {
    tab = b.dataset.tab;
    $('.library-panel').classList.add('mobile-open');
    renderLibrary();
    return;
  }
  if (b.dataset.page) {
    pageId = b.dataset.page;
    selected = null;
    render();
    return;
  }
  if (b.dataset.select) {
    selected = b.dataset.select;
    $('.library-panel').classList.remove('mobile-open');
    render();
    return;
  }
  if (b.dataset.shape) {
    addNode(
      node('shape', { shape: b.dataset.shape, w: 220, h: 220, x: 250, y: 350, fill: '#b36b49' }),
    );
    return;
  }
  if (b.dataset.art) {
    addNode(
      node('art', {
        art: b.dataset.art,
        w: 300,
        h: 360,
        x: 210,
        y: 280,
        fill: '#b36b49',
        mask: 'arch',
      }),
    );
    return;
  }
  if (b.dataset.background) {
    currentPage().background = b.dataset.background;
    commit();
    return;
  }
  if (b.dataset.align) {
    currentNode().align = b.dataset.align;
    commit();
    return;
  }
  if (b.dataset.filter) {
    filter = b.dataset.filter;
    templateModal();
    return;
  }
  if (b.dataset.template) {
    requestReplacement(makeTemplate(b.dataset.template));
    return;
  }
  if (b.dataset.layout) {
    if (currentPage().nodes.length > 296) {
      toast('Troppi elementi per aggiungere le cornici.');
      return;
    }
    const frames = layoutFrames(b.dataset.layout);
    frames.forEach((f, i) =>
      currentPage().nodes.push(
        node(i === 0 ? 'art' : 'text', {
          ...f,
          art: 'landscape',
          fill: i === 0 ? '#c48759' : '#344b39',
          fontSize: 22,
          text: 'Uno spazio per le tue idee.\n\nSeleziona questa cornice e scrivi il tuo testo.',
          mask: 'rect',
        }),
      ),
    );
    selected = null;
    closeModal();
    commit();
    toast('Cornici aggiunte. Puoi modificarle liberamente.');
  }
});
document.addEventListener('change', (e) => {
  const input = e.target,
    key = input.dataset.prop,
    n = currentNode();
  if (key && n) {
    let v = input.value;
    if (input.type === 'number') {
      v = Number(v);
      if (!Number.isFinite(v) || v < Number(input.min) || v > Number(input.max)) {
        toast('Inserisci un valore tra ' + input.min + ' e ' + input.max + '.');
        renderInspector();
        return;
      }
      if (key === 'opacity') v /= 100;
    }
    if (key === 'values') {
      v = v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number);
      if (
        !v.length ||
        v.length > 24 ||
        v.some((x) => !Number.isFinite(x) || x < 0 || x > 1000000)
      ) {
        toast('Inserisci da 1 a 24 numeri tra 0 e 1.000.000.');
        renderInspector();
        return;
      }
    }
    n[key] = v;
    commit();
  }
  if (input.id === 'document-name') {
    doc.name = input.value.trim() || 'Senza titolo';
    commit();
  }
  if (input.id === 'page-name') {
    currentPage().name = input.value.trim() || 'Pagina';
    commit();
  }
  if (input.id === 'page-color') {
    currentPage().background = input.value;
    commit();
  }
});
let drag = null;
$('#stage').addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  const hit = e.target.closest('[data-hit],[data-resize]');
  if (!hit) {
    selected = null;
    render();
    return;
  }
  e.preventDefault();
  selected = hit.dataset.hit || hit.dataset.resize;
  const n = currentNode();
  const rect = $('#stage').getBoundingClientRect();
  drag = {
    id: n.id,
    resize: !!hit.dataset.resize,
    startX: e.clientX,
    startY: e.clientY,
    start: clone(n),
    zoom,
    rect,
  };
  $('#stage').setPointerCapture(e.pointerId);
  $('#stage').focus({ preventScroll: true });
  renderCanvas();
  renderInspector();
});
$('#stage').addEventListener('pointermove', (e) => {
  if (!drag) return;
  const n = currentNode();
  if (!n) return;
  let dx = (e.clientX - drag.startX) / drag.zoom,
    dy = (e.clientY - drag.startY) / drag.zoom;
  if (drag.resize) {
    const a = (-drag.start.rotation * Math.PI) / 180,
      rx = dx * Math.cos(a) - dy * Math.sin(a),
      ry = dx * Math.sin(a) + dy * Math.cos(a);
    n.w = Math.max(20, Math.min(2000, drag.start.w + rx));
    n.h = Math.max(20, Math.min(2000, drag.start.h + ry));
    // Keep the rotated top-left corner fixed while changing the box around its center.
    const da = n.w - drag.start.w,
      db = n.h - drag.start.h,
      ang = (drag.start.rotation * Math.PI) / 180;
    n.x = drag.start.x + (da * Math.cos(ang) - db * Math.sin(ang) - da) / 2;
    n.y = drag.start.y + (da * Math.sin(ang) + db * Math.cos(ang) - db) / 2;
  } else {
    n.x = Math.max(-n.w + 15, Math.min(705, drag.start.x + dx));
    n.y = Math.max(-n.h + 15, Math.min(945, drag.start.y + dy));
    if (grid) {
      n.x = Math.round(n.x / 12) * 12;
      n.y = Math.round(n.y / 12) * 12;
    }
  }
  renderCanvas();
});
function finishDrag(e) {
  if (!drag) return;
  drag = null;
  if ($('#stage').hasPointerCapture(e.pointerId)) $('#stage').releasePointerCapture(e.pointerId);
  commit();
}
$('#stage').addEventListener('pointerup', finishDrag);
$('#stage').addEventListener('pointercancel', finishDrag);
$('#stage').addEventListener('dblclick', (e) => {
  if (e.target.closest('[data-hit]') && ['text', 'curve'].includes(currentNode()?.type)) {
    const area = $('[data-prop="text"]');
    area?.focus();
    area?.select();
  }
});
document.addEventListener('keydown', (e) => {
  if ($('#modal').open) return;
  const editing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    actions.save();
    return;
  }
  if (editing) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    actions[e.shiftKey ? 'redo' : 'undo']();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    actions.duplicate();
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    actions.delete();
  }
  if (e.key === 'Escape') {
    selected = null;
    render();
  }
  const n = currentNode();
  if (n && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
    const delta = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft') n.x -= delta;
    if (e.key === 'ArrowRight') n.x += delta;
    if (e.key === 'ArrowUp') n.y -= delta;
    if (e.key === 'ArrowDown') n.y += delta;
    commit();
  }
});
$('#modal').addEventListener('cancel', (e) => {
  e.preventDefault();
  closeModal();
});
$('#modal').addEventListener('click', (e) => {
  if (e.target === $('#modal')) {
    const r = e.target.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      closeModal();
  }
});
$('#project-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    if (file.size > 25000000) throw new Error('Il progetto supera 25 MB.');
    const parsed = validateDocument(JSON.parse(await file.text()));
    requestReplacement(parsed);
  } catch (error) {
    toast('Impossibile aprire il progetto: ' + error.message);
  }
});
let replaceImageId = null;
async function readImage(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('Usa immagini PNG, JPEG o WebP.');
  if (file.size > 12000000) throw new Error('L’immagine supera 12 MB.');
  const objectURL = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    image.src = objectURL;
    await image.decode();
    if (!image.width || !image.height || image.width * image.height > 80000000)
      throw new Error('Immagine troppo grande.');
    const scale = Math.min(1, 2400 / Math.max(image.width, image.height));
    const c = document.createElement('canvas');
    c.width = Math.round(image.width * scale);
    c.height = Math.round(image.height * scale);
    c.getContext('2d').drawImage(image, 0, 0, c.width, c.height);
    return {
      source: c.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.9),
      ratio: image.height / image.width,
    };
  } finally {
    URL.revokeObjectURL(objectURL);
  }
}
async function insertImage(file) {
  try {
    const image = await readImage(file);
    const existing = currentPage().nodes.find((n) => n.id === replaceImageId);
    const next = clone(doc);
    const p = next.pages.find((p) => p.id === pageId);
    let id;
    if (existing) {
      p.nodes.find((n) => n.id === existing.id).source = image.source;
      id = existing.id;
    } else {
      const h = Math.min(500, 330 * image.ratio),
        w = h / image.ratio;
      const n = node('image', {
        source: image.source,
        w,
        h,
        x: (720 - w) / 2,
        y: (960 - h) / 2,
        mask: 'arch',
      });
      p.nodes.push(n);
      id = n.id;
    }
    validateDocument(next);
    doc = next;
    selected = id;
    commit();
    toast('Immagine inserita. Scegli una maschera nelle proprietà.');
  } catch (e) {
    toast(e.message);
  } finally {
    replaceImageId = null;
  }
}
$('#image-file').addEventListener('change', (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (f) insertImage(f);
});
$('#viewport').addEventListener('dragover', (e) => {
  e.preventDefault();
  $('#viewport').classList.add('drop-active');
});
$('#viewport').addEventListener('dragleave', () => $('#viewport').classList.remove('drop-active'));
$('#viewport').addEventListener('drop', (e) => {
  e.preventDefault();
  $('#viewport').classList.remove('drop-active');
  const f = e.dataTransfer.files[0];
  if (f) {
    replaceImageId = null;
    insertImage(f);
  }
});
$('#obj-file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f || !studio) return;
  const activeStudio = studio;
  try {
    if (f.size > 5000000) throw new Error('Il modello supera 5 MB.');
    const source = await f.text();
    if (studio !== activeStudio) return;
    const model = studio.module.parseOBJ(source);
    try {
      studio.module.projectModel(model, studio);
    } catch (error) {
      studio.module.disposeModel(model);
      throw error;
    }
    studio.module.disposeModel(studio.model);
    studio.model = model;
    $('#studio-model').selectedIndex = -1;
    updateStudio();
    toast('Modello OBJ importato.');
  } catch (err) {
    toast(err.message);
  }
});
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fit, 100);
});
render();
fit();
status(restored ? 'Salvato in locale' : 'Pronto per creare');
if (restoreProblem) {
  status('Ripristino non riuscito');
  toast(
    'Il progetto locale non è stato ripristinato. La copia esistente è conservata finché non inizi a modificare.',
  );
} else if (!restored) save();

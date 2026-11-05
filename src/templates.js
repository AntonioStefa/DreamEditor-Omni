import { node as n, page, document, uid, clone } from './model.js';
const text = (text, x, y, w, h, fontSize = 24, props = {}) =>
  n('text', { text, x, y, w, h, fontSize, ...props });
const label = (s, x, y, w = 300, props = {}) =>
  text(s, x, y, w, 30, 11, { fontFamily: 'Arial', weight: 'bold', ...props });
const rule = (x, y, w, color = '#b9b8a9') => n('shape', { x, y, w, h: 1, fill: color });
const art = (kind, x, y, w, h, props = {}) => n('art', { art: kind, x, y, w, h, ...props });
const body =
  'La bellezza si nasconde nelle relazioni: tra una forma e il suo spazio, tra una parola e il silenzio che la circonda. Progettare significa osservare, scegliere e lasciare respirare le idee.\n\nOgni pagina è un piccolo paesaggio. Le immagini aprono possibilità, il testo costruisce un percorso. Insieme raccontano qualcosa che nessuno dei due potrebbe dire da solo.';
const templates = [
  {
    id: 'botanica',
    name: 'Botanica',
    category: 'Magazine',
    tag: 'EDITORIALE · 2 PAGINE',
    color: '#e9e4d7',
    description: 'Forme organiche, ritmo lento e dettagli naturali.',
    pages: [
      page('01 — La natura delle idee', '#f5f2e9', [
        label('BOTANICA', 48, 33, 200),
        label('STORIE DI FORME E DI NATURA', 385, 33, 290, { align: 'right' }),
        rule(48, 75, 624),
        text('La natura\ndelle idee.', 47, 105, 610, 196, 79, { fill: '#273f34' }),
        art('botanical', 270, 315, 400, 520, { mask: 'arch', fill: '#b36b49' }),
        text('Coltivare\nnuovi punti\ndi vista.', 48, 380, 205, 155, 32, { fill: '#344b39' }),
        rule(48, 578, 130, '#a57a52'),
        text('Un viaggio tra forme\norganiche, materia e\nimmaginazione.', 48, 602, 190, 100, 16, {
          fontFamily: 'Arial',
          fill: '#707265',
        }),
        n('curve', {
          x: 43,
          y: 748,
          w: 360,
          h: 105,
          text: 'lascia spazio alla meraviglia',
          fontSize: 20,
          curve: 35,
          fill: '#a05d40',
        }),
        rule(48, 889, 624),
        label('VOLUME 01   /   STUDIO NOTES', 48, 912, 380),
        label('01', 620, 912, 52, { align: 'right' }),
      ]),
      page('02 — Uno spazio per crescere', '#f5f2e9', [
        label('BOTANICA / CULTURA DEL PROGETTO', 48, 38, 450),
        rule(48, 77, 624),
        text('Uno spazio\nper crescere.', 48, 112, 580, 158, 62, { fill: '#273f34' }),
        art('landscape', 48, 300, 295, 310, { mask: 'arch', fill: '#c48a5f' }),
        text('«Ogni forma\ninizia da\nun’osservazione.»', 380, 326, 280, 190, 32, {
          fill: '#a05d40',
        }),
        text(body, 48, 648, 295, 215, 15, { fontFamily: 'Arial', fill: '#4c5449' }),
        text(
          'Il ritmo della pagina\n\nAlterna pieni e vuoti. Una griglia è un punto di partenza: puoi seguirla, trasformarla o interromperla.\n\nScegli una forma, un colore e una voce. Poi trova il tuo equilibrio.',
          380,
          648,
          280,
          215,
          15,
          { fontFamily: 'Arial', fill: '#4c5449' },
        ),
        rule(48, 889, 624),
        label('APPUNTI PER UNO SGUARDO NUOVO', 48, 912, 420),
        label('02', 620, 912, 52, { align: 'right' }),
      ]),
    ],
  },
  {
    id: 'forma',
    name: 'Forma / Materia',
    category: 'Design',
    tag: 'DESIGN · 2 PAGINE',
    color: '#de7149',
    description: 'Geometrie audaci, colori caldi e composizione modulare.',
    pages: [
      page('01 — Forma e materia', '#e6784e', [
        label('FORMA / MATERIA', 45, 35, 340),
        label('DESIGN JOURNAL     N° 08', 400, 35, 275, { align: 'right' }),
        rule(45, 80, 630, '#743f2d'),
        text('Nuove\nprospettive', 42, 111, 640, 196, 76, { fontFamily: 'Arial', weight: 'bold' }),
        art('orbit', 45, 331, 420, 478, { mask: 'arch', fill: '#df794c' }),
        text('08', 490, 347, 190, 120, 98),
        text('La geometria\ndell’essenziale.', 490, 500, 180, 100, 22),
        text('Oggetti, volumi e\nvisioni da abitare.', 490, 688, 170, 80, 15, {
          fontFamily: 'Arial',
        }),
        rule(45, 875, 630, '#743f2d'),
        label('ARCHITETTURA   /   ARTE   /   CULTURA', 45, 902, 500),
        label('01', 620, 902, 50),
      ]),
      page('02 — L’equilibrio delle forme', '#eee9df', [
        label('FORMA / MATERIA', 48, 38),
        rule(48, 80, 624),
        text('L’equilibrio\ndelle forme.', 48, 115, 620, 160, 63, {
          fontFamily: 'Arial',
          weight: 'bold',
        }),
        art('orbit', 48, 320, 290, 350, { fill: '#dc704a' }),
        art('ink', 368, 320, 304, 350, { fill: '#315344' }),
        text(body, 48, 715, 624, 155, 17),
        label('DUE MODI DI LEGGERE LO STESSO SPAZIO', 48, 910, 570),
      ]),
    ],
  },
  {
    id: 'romanzo',
    name: 'Le ore lente',
    category: 'Libro',
    tag: 'NARRATIVA · 2 PAGINE',
    color: '#d9d5c8',
    description: 'Una voce letteraria, margini ampi e tipografia classica.',
    pages: [
      page('Copertina', '#253c35', [
        label('EDIZIONI ORIZZONTE', 170, 72, 380, { fill: '#e8d8b4', align: 'center' }),
        text('Le ore\nlente', 80, 182, 560, 260, 100, { fill: '#f1e6ce', align: 'center' }),
        art('landscape', 170, 470, 380, 300, { mask: 'arch', fill: '#d4a36c' }),
        text('Elena Valli', 140, 830, 440, 65, 29, { fill: '#e8d8b4', align: 'center' }),
      ]),
      page('Capitolo uno', '#f8f5ee', [
        label('LE ORE LENTE', 190, 40, 340, { align: 'center', fill: '#777367' }),
        text('I', 260, 145, 200, 80, 60, { align: 'center' }),
        text('La casa sulla collina', 100, 252, 520, 75, 34, { align: 'center' }),
        text(
          'Il mattino arrivava piano, attraversando le tende come una promessa. Dal giardino saliva l’odore della terra bagnata e, per un istante, tutto sembrò trovare il proprio posto.\n\n' +
            body +
            '\n\nElena aprì il quaderno. Non cercava ancora una storia: cercava soltanto una frase da cui cominciare. La scrisse lentamente, lasciando che il rumore degli alberi entrasse tra le parole.',
          100,
          370,
          520,
          440,
          19,
        ),
        label('1', 320, 900, 80, { align: 'center' }),
      ]),
    ],
  },
  {
    id: 'didattica',
    name: 'Piccole scoperte',
    category: 'Didattica',
    tag: 'DIDATTICA · 1 PAGINA',
    color: '#cdd7c5',
    description: 'Informazioni chiare, grafici e spazio per la curiosità.',
    pages: [
      page('Osservare la natura', '#f7f4eb', [
        label('PICCOLE SCOPERTE / SCIENZE', 48, 35, 500, { fill: '#4d6b4f' }),
        rule(48, 80, 624),
        text('Come cresce\nun’idea?', 48, 108, 620, 170, 64, {
          fontFamily: 'Arial',
          weight: 'bold',
          fill: '#304b3c',
        }),
        art('botanical', 48, 300, 250, 315, { mask: 'ellipse', fill: '#bc8550' }),
        text('01  Osserva', 345, 302, 310, 45, 26, { weight: 'bold' }),
        text(
          'Ogni pianta risponde alla luce e all’acqua. Osservare le differenze è il primo passo per formulare una domanda.',
          345,
          365,
          305,
          150,
          20,
        ),
        n('shape', { x: 345, y: 530, w: 312, h: 83, fill: '#dce5cb' }),
        text('PROVA TU\nMisura una foglia ogni giorno.', 362, 545, 280, 60, 16, {
          fontFamily: 'Arial',
        }),
        text('Misurare il cambiamento', 48, 662, 600, 50, 28),
        n('chart', {
          x: 48,
          y: 737,
          w: 350,
          h: 130,
          values: [12, 25, 32, 48, 67],
          fill: '#557554',
        }),
        text(
          'Cinque osservazioni,\nuna nuova domanda.\n\nDati dimostrativi.',
          445,
          750,
          220,
          120,
          16,
          { fontFamily: 'Arial', fill: '#606a58' },
        ),
        rule(48, 905, 624),
        label('LABORATORIO 01', 48, 925),
        label('01', 620, 925, 50),
      ]),
    ],
  },
  {
    id: 'manifesto',
    name: 'Onde / Frequenze',
    category: 'Poster',
    tag: 'TIPOGRAFIA · 1 PAGINA',
    color: '#d9e2ec',
    description: 'Segni fluidi e un titolo che segue il movimento.',
    pages: [
      page('Onde e frequenze', '#dce5ed', [
        label('STUDIO EXPERIMENTAL / 2026', 40, 35, 500),
        text('ONDE', 35, 105, 650, 180, 140, {
          fontFamily: 'Arial',
          weight: 'bold',
          fill: '#29445b',
        }),
        art('ink', 100, 295, 520, 460, { mask: 'ellipse', fill: '#31536b' }),
        n('curve', {
          x: 45,
          y: 620,
          w: 630,
          h: 200,
          text: 'le idee seguono nuove frequenze',
          fontSize: 32,
          curve: 95,
          fill: '#b65539',
        }),
        rule(45, 852, 630, '#9aaaba'),
        text('Un esercizio di libertà.', 45, 878, 550, 50, 25, { fill: '#29445b' }),
        label('05', 620, 900, 50),
      ]),
    ],
  },
];
export function makeTemplate(id) {
  const t = templates.find((t) => t.id === id) || templates[0];
  const pages = clone(t.pages);
  for (const p of pages) {
    p.id = uid();
    for (const n of p.nodes) n.id = uid();
  }
  return document(t.name, pages);
}
export { templates };

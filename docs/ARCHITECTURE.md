# DreamEditor 0.1 — contract del prototipo

Un documento JSON versionato è l'unica fonte di verità. Il renderer SVG viene usato sia dall'editor sia dalle miniature e dall'export: nessun secondo scene graph da sincronizzare. Le coordinate sono espresse nello spazio logico della pagina (720 × 960); lo zoom è esclusivamente una trasformazione della vista.

- model.js: schema, validazione, storia, geometria delle cornici e composizioni proporzionali.
- render.js: SVG deterministico, maschere, testo su curva, layout delle righe, grafici.
- templates.js: esempi editoriali locali, nessuna risorsa di rete.
- studio3d.js: Three.js isolato per OBJ e proiezione wireframe; produce tracciati SVG ordinari. Nessun renderer WebGL globale.
- main.js: interazioni DOM, autosalvataggio, gestione file e UI.
- style.css: sistema visivo e layout responsive.

Dipendenze esatte e lockfile. Lucide gestisce soltanto le icone dell'interfaccia. Three.js è caricato dinamicamente quando si apre lo studio 3D. Gli effetti non si contendono selezione, undo o salvataggio.

Funzioni previste per 0.1: più pagine, cinque famiglie di template, testo e titolo curvo, forme, maschere immagini, grafici, disegni vettoriali, griglie proporzionali, inspector, livelli, drag/resize, undo/redo, JSON, SVG, PNG e stampa browser. Esempio 3D parametrico + importazione OBJ e ricetta wireframe.

Fuori dal contratto 0.1: flusso automatico di romanzi tra cornici, LaTeX, editor Bézier, CMYK/PDF-X, collaborazione, importazione GLB/FBX e vera incisione da 3D con rimozione delle linee nascoste. La stampa PDF usa il browser; non è prestampa certificata. Nessun effetto è etichettato come implementato quando non lo è.

Verifica: test di validazione e proporzioni, browser reale per modifiche, undo, import/export, persistenza, template, immagini e studio 3D. Build distribuibile senza risorse remote. Non pubblicare né fare push automaticamente.

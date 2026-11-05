# Scelte delle librerie

Ricognizione delle fonti ufficiali: 5 novembre 2026. Questa è una valutazione architetturale, non un benchmark di tutti i candidati. Le integrazioni effettivamente provate sono soltanto quelle elencate come adottate. Le condizioni di licenza vanno ricontrollate sulle versioni scelte prima di distribuire moduli aggiuntivi.

## Decisione per il prototipo

Un renderer SVG nativo condiviso da editor, miniature e export. Nessun Fabric/Konva/Pixi in parallelo, nessun scene graph duplicato. Vite per il build; Lucide per le icone; Three.js importato dinamicamente, utilizzato per la geometria e la proiezione 3D, senza contesto WebGL. Tutto il codice applicativo è JavaScript.

Il documento JSON non contiene oggetti delle librerie. Three.js restituisce una lista di tracciati, quindi storia, livelli, salvataggio e render continuano ad appartenere a DreamEditor. L'esportazione PDF avviene tramite stampa del browser. Il 3D del prototipo è wireframe ortografico, con linee posteriori visibili.

## Candidati creativi

| Libreria / fonte ufficiale                                                                     | Capacità pertinente                                                   | Decisione                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Zdog](https://github.com/metafizzy/zdog)                                                      | Pseudo-3D illustrativo con primitive tonde, canvas o SVG              | Buon futuro generatore di icone e oggetti giocosi. Non è un importatore generale di mesh 3D.                                                               |
| [Snap.svg](https://github.com/adobe-webplatform/Snap.svg)                                      | Manipolazione SVG                                                     | Ridondante nel prototipo: SVG e DOM nativi coprono già le operazioni richieste. Verificare manutenzione e API prima di adottarlo.                          |
| [PixiJS](https://github.com/pixijs/pixijs)                                                     | Renderer 2D WebGL/WebGPU, effetti e scene ricche                      | Possibile modulo raster/GPU per texture e pennelli. Non implica export vettoriale o tipografia editoriale. Richiede una prova di memoria, fallback e resa. |
| [Pts](https://github.com/williamngan/pts)                                                      | Geometria e creative coding                                           | Candidato per generatori parametrici. Produrrebbe tracciati o asset, non controllerebbe il documento.                                                      |
| [Isometric](https://github.com/elchininet/isometric)                                           | Proiezioni isometriche SVG                                            | Interessante per diagrammi didattici e architetture stilizzate. Non equivale a trasformare qualsiasi mesh in incisione artistica.                          |
| [Paper.js](https://github.com/paperjs/paper.js)                                                | Curve, geometria vettoriale e operazioni sui tracciati                | Candidato per l'editor Bézier e operazioni booleane. Non necessario per le forme semplici di 0.1.                                                          |
| [p5.js](https://github.com/processing/p5.js)                                                   | Creative coding, pattern e disegno                                    | Futuro modulo generativo isolato, da caricare su richiesta.                                                                                                |
| [p5.brush](https://github.com/acamposuribe/p5.brush)                                           | Tratti artistici, texture; il README documenta p5 e standalone WebGL2 | Futuro modulo pittorico, da provare per prestazioni, determinismo ed export ad alta risoluzione.                                                           |
| [Fabric.js](https://github.com/fabricjs/fabric.js) / [Konva](https://github.com/konvajs/konva) | Editor grafici interattivi                                            | Alternative al motore, non aggiunte automatiche. Rivalutare se i requisiti superano il renderer SVG attuale.                                               |
| [tldraw](https://github.com/tldraw/tldraw)                                                     | Canvas infinito e strumenti collaborativi                             | Eventuale spazio moodboard separato. Controllare licenza di produzione.                                                                                    |

## Tipografia: funzioni distinte

| Candidato                                                                               | Cosa risolve                                                                 | Cosa resta da costruire/verificare                                                                                                                                  |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [OpenType.js](https://github.com/opentypejs/opentype.js)                                | Lettura font, accesso ai glifi e ai contorni                                 | Titoli deformabili e conversione in tracciati; non compone interi libri automaticamente.                                                                            |
| [Fontkit](https://github.com/foliojs/fontkit)                                           | Sostituzione/posizionamento dei glifi, estrazione contorni e subset dei font | Motore da integrare con layout, flusso, licenze dei font ed export.                                                                                                 |
| HarfBuzz tramite WebAssembly                                                            | Shaping avanzato multilingue                                                 | Selezionare un wrapper mantenuto e verificare RTL, legature, font variabili, distribuzione e performance. Non ancora confrontato sperimentalmente.                  |
| [Paged.js](https://github.com/pagedjs/pagedjs)                                          | HTML/CSS paginato                                                            | Prova con note, vedove/orfane e pagine mastro. Non fornisce direttamente flusso tra cornici libere.                                                                 |
| [Vivliostyle](https://github.com/vivliostyle/vivliostyle.js)                            | Typesetting HTML/CSS, pagine e pubblicazioni EPUB/web                        | Confrontare con Paged.js usando lo stesso manoscritto.                                                                                                              |
| [KaTeX](https://github.com/KaTeX/KaTeX) / [MathJax](https://github.com/mathjax/MathJax) | Rendering di formule matematiche                                             | Non sono un motore generale LaTeX per libri. Introdurre un tipo formula senza alterare i paragrafi ordinari.                                                        |
| [Typst](https://github.com/typst/typst)                                                 | Sistema di composizione, formule, bibliografia                               | Il motore è Rust, non JavaScript puro. Possibile percorso WASM, consentito dall'utente, ma richiede un'integrazione dedicata e una verifica del formato di scambio. |

## Criteri prima di aggiungere una libreria

1. Un esempio concreto che il motore attuale non sa produrre bene.
2. API isolate, nessuna gestione parallela della storia o dei livelli.
3. Versione fissata e licenza verificata.
4. File salvabile e riapribile senza perdita di informazioni.
5. Test dell'export e del comportamento senza rete.
6. Limiti espliciti per input grandi, rilascio della memoria, tempo di risposta.

## Limiti tipografici di 0.1

Testo SVG con misura delle righe tramite canvas e font locali Georgia/Arial/Courier New. Sono disponibili dimensione, peso, allineamento, titolo su onda e segnalazione del testo eccedente. Non ci sono sillabazione professionale, kerning manuale, font incorporati, giustificazione avanzata, composizione multilingue verificata, testo concatenato o conversione dei glifi in contorni. L'aspetto dei font può cambiare tra sistemi. Questi limiti sono esposti nella guida dell'app.

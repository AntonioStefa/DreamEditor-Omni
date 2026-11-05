# Verifica del prototipo 0.1

Data: 5 novembre 2026. Ambiente: Linux, Node.js 24.22.1, Chromium di sistema, Playwright 1.56.1.

## Risultati

- **8 test del modello passati**: roundtrip di tutti i template, identificatori indipendenti, storia undo/redo, geometria dei layout senza sovrapposizioni, rifiuto degli input non validi, escaping del testo, duplicazione, proiezione 3D e import OBJ.
- **14 test browser passati**: caricamento senza errori JavaScript o icone mancanti; modifica testo; proprietà; trascinamento; ridimensionamento; tastiera; ordinamento livelli; undo/redo; layout proporzionali; tutti i template; più pagine; persistenza dopo reload; import/export JSON; rifiuto dei file invalidi; immagine e maschera; file SVG/PNG reali; PDF del browser; camera 3D e OBJ; dati grafico; titolo ondulato; controlli tablet e telefono.
- **Test dei template con i font effettivi del browser passato**: nessun testo iniziale eccede la propria cornice. La prova aveva individuato quattro cornici titolo troppo basse, corrette prima della consegna.
- **Build di produzione completata**. Bundle iniziale JavaScript circa 71 kB prima di gzip; modulo 3D circa 139 kB, caricato su richiesta. CSS circa 25 kB.
- **Formattazione del sorgente verificata** con Prettier.
- **Smoke test del pacchetto passato**: avvio con il server JavaScript incluso, caricamento dei sei progetti JSON, import del modulo 3D lazy, export PNG verificato a 1440 × 1920 pixel e apertura della vista stampa. Nessun errore JavaScript e nessuna richiesta di rete esterna; il browser del test blocca qualunque destinazione diversa dal server locale.
- **Ispezione visiva** dell'editor desktop e della galleria template tramite screenshot reali. Sono incluse anche le anteprime 3D e tablet.

## Comandi riproducibili

```sh
npm ci
npm run test
npm run build
npm run test:e2e
npm run format:check
npm run package
npm run test:release
```

`npm run package` richiede l'utility `zip`. Le prove browser richiedono Chromium; vedere il README per il percorso configurabile. Nel cloud, il server locale e Chromium richiedono l'esecuzione autorizzata fuori dal sandbox dei comandi. Le verifiche effettive sono state eseguite in quel contesto.

## Limiti delle verifiche

Nessuna certificazione di prestampa, verifica CMYK/PDF-X, prova su Safari/Firefox o esecuzione dei launcher su Windows/macOS. Le viewport mobili sono state controllate in Chromium desktop, non su dispositivi touch reali. Nessun benchmark di documenti al limite massimo o confronto sperimentale fra tutte le librerie candidate. I font sono quelli disponibili nel sistema di test.

L'esportazione PDF conserva la rappresentazione SVG e usa il motore di stampa del browser; l'accessibilità PDF e la fedeltà su ogni stampante non sono certificate.

Nessun deploy, push Git o pubblicazione dell'ambiente eseguito. Il risultato consegnato è un pacchetto locale avviabile e il relativo codice sorgente.

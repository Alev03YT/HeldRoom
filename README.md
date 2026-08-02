# HeldRoom

HeldRoom è un progetto di escape room horror interattive giocabili dal browser.

## Prima stanza: La Bambola di Ashwood

Prototipo originale ispirato alle atmosfere delle case infestate e delle bambole maledette. La storia, i personaggi e il nome della bambola sono originali, così il progetto potrà essere pubblicato e venduto senza dipendere da un franchise cinematografico esistente.

### Funzioni presenti

- timer reale da 60 minuti;
- introduzione cinematografica con narrazione vocale in italiano;
- cinque ambienti attraversabili;
- enigmi progressivi;
- inventario;
- tre aiuti contestuali;
- salvataggio automatico in locale;
- effetti di lampi, pioggia, movimenti di camera e jumpscare;
- atmosfera sonora generata tramite Web Audio API;
- finale positivo e finale per tempo scaduto;
- interfaccia responsive per smartphone e computer.

## Avvio locale

È sufficiente aprire `index.html` in un browser moderno. Per evitare limitazioni del browser è comunque consigliato usare un piccolo server locale, per esempio Live Server in Visual Studio Code.

## Pubblicazione con GitHub Pages

Nel repository aprire:

1. `Settings`;
2. `Pages`;
3. in `Build and deployment` scegliere `Deploy from a branch`;
4. selezionare il branch `main` e la cartella `/ (root)`;
5. salvare.

Il sito verrà pubblicato all'indirizzo indicato da GitHub Pages.

## Struttura

- `index.html`: schermate e interfaccia di gioco;
- `style.css`: grafica, ambientazioni e animazioni;
- `script.js`: motore di gioco, timer, enigmi, audio e salvataggio.

## Sviluppi consigliati

Questa è una base giocabile e dimostrativa. Per ottenere una vera esperienza commerciale da circa 60 minuti sarà necessario ampliare la stanza con:

- almeno 12-18 enigmi principali e secondari;
- scene illustrate o render 3D originali;
- audio registrato professionalmente;
- sottotitoli sincronizzati;
- più oggetti combinabili;
- percorsi alternativi e finali multipli;
- sistema account, pagamenti e codici di accesso;
- pannello amministratore per aggiungere nuove escape room;
- analisi dei tempi medi di soluzione e bilanciamento degli enigmi.

## Nota legale

Non usare nomi, loghi, immagini, dialoghi o personaggi protetti appartenenti a film esistenti senza una licenza. Un'identità originale consente di costruire un prodotto commercializzabile e riconoscibile come HeldRoom.

# HeldRoom — La Bambola di Ashwood

Escape room horror originale da browser, progettata per una sessione massima di 60 minuti.

## Contenuto attuale

- 15 ambientazioni/inquadrature interattive
- enigmi principali e secondari
- inventario con oggetti combinabili
- percorso di Clara e percorso corrotto della casa
- finali differenti
- eventi horror casuali e legati al tempo
- salvataggio automatico
- timer da 60 minuti
- voce italiana automatica come fallback
- struttura pronta per registrazioni professionali
- interfaccia responsive per smartphone e desktop

## Registrazioni professionali

Il gioco cerca automaticamente questi file:

```text
audio/clara-intro.mp3
audio/clara-finale.mp3
```

Quando i file non esistono o non possono essere riprodotti, viene usata la sintesi vocale italiana del dispositivo. Altre battute registrate possono essere aggiunte estendendo la mappa `file` nella funzione `speak()` di `script.js`.

## Pubblicazione GitHub Pages

1. Aprire **Settings** nel repository.
2. Entrare in **Pages**.
3. Selezionare **Deploy from a branch**.
4. Scegliere `main` e `/ root`.

Indirizzo previsto:

```text
https://alev03yt.github.io/HeldRoom/
```

## Nota sul progetto

La storia e la bambola sono originali e non usano il nome, i personaggi o il materiale grafico dei film di Annabelle. Questo rende il progetto più adatto a una futura pubblicazione commerciale.

# Secret Santa V5.1

Secret Santa V5 ajoute :

- un **message WhatsApp unique** personnalisable, partageable avant **et** après le tirage ;
- un **ticket à gratter visuel** basé sur l'image fournie, avec révélation du prénom dans la zone des ballons ;
- l'affichage de **l'emoji du destinataire** dans le ticket révélé ;
- une présentation plus subtile de la **décoration personnalisée** de chaque participant ;
- la **compatibilité avec les événements V4** déjà stockés dans `events.json`.

## Démarrage local

```bash
node server.js
```

L'application écoute sur `http://localhost:3000` par défaut.

Variables utiles :

- `HOST` (ex. `0.0.0.0`)
- `PORT`
- `DATA_DIR` (ex. `/data` sur Railway)

## Mise à jour depuis la V4

Remplacer dans ton dépôt GitHub :

- `server.js`
- `package.json`
- `public/app.js`
- `public/style.css`
- `public/ticket-avant-decouverte.png`

Ne supprime pas le volume Railway `/data`.

## Compatibilité des données

- Les anciens événements avec `messages.before` / `messages.after` sont relus automatiquement.
- La V5 utilise ensuite un champ unique `message` pour les enregistrements modifiés.
- Les tirages, souhaits et statuts de découverte restent conservés.

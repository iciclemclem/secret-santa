# Mettre Secret Santa en ligne avec Railway

## 1. Code sur GitHub

1. Créez un dépôt privé `secret-santa` sur https://github.com/new.
2. Décompressez l'archive téléchargée.
3. Dans GitHub, utilisez **Add file → Upload files** pour importer **le contenu** du dossier `secret-santa-app`, dont `server.js`, `package.json`, `public/` et `.gitignore` (en respectant les sous-dossiers). Ne téléversez ni `data/`, ni `events.json`.
4. Validez l'import avec **Commit changes**.

## 2. Déploiement Railway

1. Connectez-vous à https://railway.com/ avec votre compte GitHub.
2. **New Project → Deploy from GitHub repo**, sélectionnez le dépôt `secret-santa`.
3. Le démarrage prévu est `npm start` (`node server.js`). Dans **Settings → Deploy**, renseignez au besoin `npm start` comme Start Command.
4. Dans **Variables**, ajoutez : `HOST=0.0.0.0` et `DATA_DIR=/data`.
5. Attachez au service un **Volume** monté sur `/data` (via service → Volumes ou clic droit sur le service → Attach volume, selon l'interface).
6. Appliquez les changements et redéployez. Il est préférable d'attacher le volume AVANT le premier vrai Secret Santa.
7. Dans **Settings → Networking**, cliquez **Generate Domain** pour obtenir une URL publique HTTPS.

Important : Railway peut facturer l'hébergement et le volume selon votre usage / votre offre. Consultez ses tarifs actuels.

## 3. Test avant envoi des invitations

1. Ouvrez le domaine `https://...up.railway.app`.
2. Créez un événement fictif avec trois prénoms.
3. Enregistrez le lien organisateur dans un endroit privé.
4. Lancez le tirage et copiez un lien pour chaque ami.
5. Ouvrez chaque lien en navigation privée : chaque personne doit voir uniquement son destinataire.
6. Redéployez une fois et vérifiez qu'un lien fonctionne toujours (test de persistance).

## Limites de la V1

- Toute personne disposant d'un lien peut consulter le résultat associé.
- L'organisateur peut ouvrir les liens des participants et donc consulter leurs destinataires.
- Aucun mécanisme de révocation et aucune authentification.
- Les données doivent être sauvegardées et protégées ; ne les publiez jamais dans GitHub.
- Conservez une seule instance serveur avec le stockage JSON ; une base de données sera nécessaire pour monter en charge.

Consultez également le fichier README.md pour les détails techniques.

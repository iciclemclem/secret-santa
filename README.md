# 🎄 Secret Santa — V4

Application web mobile pour organiser un Secret Santa privé, avec tirage sans auto-attribution, exclusions, souhaits et ticket à gratter.

## Nouveautés V4

- **WhatsApp avant ET après le tirage** : les liens privés existent dès la création. Avant le tirage, le participant voit « tirage à venir » et peut compléter ses souhaits. Après, il peut découvrir son destinataire.
- **Deux modèles de message WhatsApp éditables par l'organisateur** : « Avant le tirage » et « Après le tirage ». Ils sont enregistrés dans `events.json` et utilisés automatiquement selon la phase de l'événement.
- **Exclusions de couples** : deux listes déroulantes de prénoms et un bouton « Ajouter l'exclusion ». L'exclusion fonctionne dans les deux sens. Une liste permet de retirer les exclusions ajoutées.
- **Emoji de Noël unique par participant** : attribué automatiquement lors de la création de l'événement ; même emoji sur sa carte organisateur et dans sa page personnelle. Le fond, les couleurs du ticket, les flocons/objets animés et la pluie de confettis s'inspirent de son emoji et de sa famille visuelle.
- **Conservation de la V3** : suivi des révélations, ticket toujours découvert après actualisation, listes de souhaits, 3 thèmes, liens confidentiels et événements existants.

## Modèles personnalisables

L'organisateur peut personnaliser les deux textes depuis son tableau de bord. Variables de substitution :

- `{prenom}` — prénom de l'invité
- `{emoji}` — emoji unique de l'invité
- `{evenement}` — nom de l'événement
- `{budget}` — montant formaté
- `{date}` — date de remise (ou « À définir »)
- `{lien}` — lien personnel de l'invité **obligatoire**

La prévisualisation permet de choisir l'invité et le moment. Le texte est enregistré en appuyant sur **Enregistrer les deux messages** ; les liens WhatsApp utilisent le texte actuellement édité, même non encore enregistré. Les boutons ouvrent WhatsApp avec le message préparé : **l'envoi final doit toujours être confirmé manuellement**. L'application n'envoie aucun message automatiquement et ne requiert aucun compte WhatsApp Business.

## Architecture

```text
secret-santa-v4/
├── server.js              Serveur HTTP Node.js (sans dépendance externe)
├── package.json           Commandes npm
├── public/
│   ├── index.html         Squelette HTML
│   ├── app.js             Création, tableau de bord, WhatsApp, ticket à gratter
│   └── style.css          Thèmes et animations
├── test/
│   ├── integration.test.js    Régression V2/V3
│   └── v4.test.js             Compatibilité V3 et fonctionnalités V4
├── MISE_A_JOUR_RAILWAY.md
└── README.md
```

La base de données est un fichier JSON conservé dans `DATA_DIR/events.json` ; pour Railway, `DATA_DIR=/data` avec un volume **persistant** monté sur `/data`. L'enregistrement est atomique via fichier temporaire + renommage.

## Démarrage local

Node.js 20+ requis :

```bash
npm start
```

Ouvrir http://127.0.0.1:3000 (par défaut). Pour lancer les tests automatisés :

```bash
npm test
```

En hébergement, configurer `HOST=0.0.0.0` ; `PORT` est fourni automatiquement par Railway. Aucun `npm install` externe n'est nécessaire.

## Compatibilité et confidentialité

- Les anciens liens `/gift/<token>` et `/organize/<token>` demeurent inchangés.
- La V4 lit les événements V2/V3 tels quels ; les messages manquants utilisent les modèles par défaut. Les anciens participants reçoivent un emoji de manière **déterministe selon leur position**, sans changer les tirages ni exiger de migration.
- Les événements V4 attribuent et enregistrent des emojis uniques. Le nombre maximal reste 50 participants.
- Les destinataires sont affectés seulement lors du tirage. Les liens privés sont utilisables dès la création pour saisir les listes de souhaits, sans montrer de résultat avant le tirage.
- L'organisateur visualise uniquement la liste des participants et leur statut de révélation, pas les associations de tirage.
- Après révélation, `revealedAt` reste enregistré côté serveur, même après actualisation ou changement de téléphone.
- Les liens personnels et organisateur sont des **secrets d'accès**. Ne jamais envoyer le lien organisateur dans un groupe, ni déposer le fichier `events.json` dans un dépôt GitHub.
- La V4 ne collecte pas de numéro de téléphone : elle ouvre un partage WhatsApp depuis le navigateur de l'organisateur.

## Déploiement

Consulter [MISE_A_JOUR_RAILWAY.md](MISE_A_JOUR_RAILWAY.md) pour effectuer la mise à jour sur le dépôt GitHub/Railway existant sans perdre les événements.

# Secret Santa V3 — WhatsApp et suivi des découvertes

Application web en **Node.js 20+**, sans dépendance npm externe, adaptée à Railway. Les mêmes liens individuels et organisateur continuent de fonctionner après la mise à jour V2 → V3, à condition de **conserver le volume de stockage existant**.

## Nouveautés V3

- **Invitations WhatsApp personnelles** : le bouton de chaque participant ouvre un brouillon WhatsApp contenant son prénom, l'événement, le budget, la date et **seulement son lien secret**. Choisir le destinataire et cliquer sur Envoyer dans WhatsApp reste une action manuelle. Aucune API WhatsApp ni numéro de téléphone n'est nécessaire.
- **Tableau de bord organisateur** : progression globale, badge « Pas encore découvert » / « Découvert » pour chacun, date de première découverte, bouton « Actualiser » et actualisation automatique toutes les 15 secondes lorsque l'onglet est actif.
- **Ticket à gratter persistant** : quand le participant a gratté au moins environ 42 % du ticket (ou utilisé « Révéler sans gratter »), le navigateur appelle `POST /api/gift/:token/reveal`. Le serveur enregistre une **date de première découverte** (`revealedAt`) dans `events.json`. À la prochaine ouverture ou actualisation, le ticket reste découvert, même depuis un autre appareil.
- **V2 préservée** : exclusions, thèmes, neige et confettis, listes de souhaits et tirages restent en place.

## Installation locale

```bash
node server.js
```

Puis ouvrir `http://127.0.0.1:3000`.

Tests serveur :

```bash
npm test
```

Les tests créent un stockage temporaire et ne touchent jamais au fichier de données réel.

## Mise à jour Railway

Voir [MISE_A_JOUR_RAILWAY.md](MISE_A_JOUR_RAILWAY.md).

La V3 **ne recrée pas** la base `events.json`, **ne change pas** les tokens/URL des participants et **ne modifie pas** les destinataires déjà attribués. Le serveur interprète `revealedAt` manquant comme « pas encore confirmé comme découvert ».

**Important pour les anciens événements :** les tickets grattés avant la V3 n'étaient pas enregistrés. L'organisateur ne peut donc pas retrouver l'historique des révélations passées. La fonction de suivi commence avec la V3 ; un participant qui avait déjà gratté en V2 devra confirmer une fois sa découverte dans la V3.

## Gestion des données et confidentialité

- Les tokens contenus dans les liens sont des **secrets d'accès**. Ne partagez jamais le lien organisateur ni les liens individuels dans un groupe ou sur un dépôt public.
- `events.json` contient les associations et les listes de souhaits ; il doit rester exclusivement dans le volume privé Railway (`DATA_DIR=/data`).
- Le bouton WhatsApp **prépare** le message, il ne prouve pas que le message a été envoyé. Le badge de suivi confirme l'enregistrement de la révélation côté serveur, pas l'envoi ou la lecture de l'invitation.
- L'organisateur peut accéder à tous les liens individuels, conformément au fonctionnement des versions précédentes.
- Un unique serveur Node doit écrire sur un même fichier JSON. Ne lancez pas plusieurs répliques/instances sur le même volume.
- L'interface de grattage conserve le nom sous la couche argentée côté navigateur, comme en V2. Toute personne ayant le lien personnel et inspectant la page peut donc lire son propre résultat sans gratter. Le badge indique que le participant a déclenché la révélation via l'interface ou l'API ; il ne certifie pas un geste physique.

## API ajoutée en V3

- `POST /api/gift/:token/reveal` : enregistre la première révélation, sans effacer une date existante. Répond `{ "revealedAt": "..." }`.
- `GET /api/gift/:token` : ajoute `revealedAt` (date ISO ou `null`).
- `GET /api/organize/:token` : chaque participant contient désormais `revealedAt`. Les attributions elles-mêmes restent masquées dans l'API organisateur.

Aucune migration manuelle n'est nécessaire.

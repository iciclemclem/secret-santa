# 🎄 Secret Santa — V6.2

Application web de Secret Santa privée, avec tirage au sort et ticket à gratter interactif. Interface en français, adaptée aux mobiles.

[Ouvrir l'application](https://secret-santa-production-54591bc0.up.railway.app)

## Fonctionnalités

### Organisateur
- Création d'un événement avec titre, participants (2 à 50), budget, date facultative et thème des cadeaux.
- Exclusions à sens unique ou réciproques.
- Photos facultatives avec recadrage circulaire manuel : déplacement, zoom, rotation et aperçu.
- Liens individuels privés, messages WhatsApp personnalisables et suivi des découvertes.
- Tirage au sort tenant compte des exclusions.

### Participants
- Liste de souhaits modifiable et page d'attente avant le tirage.
- Ticket GOAL! à gratter : prénom et portrait du destinataire chargés dès le premier geste, après chargement du ticket.
- Révélation enregistrée à 95 % de grattage, sans affichage du pourcentage.
- Portrait circulaire agrandi à gauche, prénom à droite, ou prénom centré en l'absence de photo.
- Décor hivernal, neige, particules, confettis et feux d'artifice.
- Sons facultatifs (désactivés par défaut), vibrations sur les navigateurs compatibles et respect de la préférence de réduction des animations.
- Messages de chargement et d'erreur conservés ; possibilité de révéler sans gratter.
- Accès aux souhaits du destinataire après révélation. Le ticket reste découvert après actualisation.

## Installation locale

Prérequis : Node.js 20 ou supérieur. Aucune dépendance npm externe nécessaire.

```sh
git clone https://github.com/iciclemclem/secret-santa.git
cd secret-santa
npm start
```

Ouvrir http://127.0.0.1:3000.

Tests automatisés : `npm test`. Les interactions tactiles, le son et le rendu sur Safari iOS doivent également être vérifiés sur un appareil réel.

## Déploiement Railway

Connecter le dépôt GitHub, branche `main`, au service Railway. Utiliser `npm start` comme commande de démarrage et monter un volume persistant sur `/data`.

| Variable | Valeur recommandée |
| --- | --- |
| `HOST` | `0.0.0.0` |
| `DATA_DIR` | `/data` |
| `PORT` | Fourni par Railway |

Les mises à jour de la branche principale peuvent déclencher un redéploiement automatique selon la configuration Railway.

## Données et confidentialité

- Les événements, liens privés, tirages, souhaits et dates de révélation sont enregistrés dans `DATA_DIR/events.json`.
- Les portraits recadrés sont stockés dans `DATA_DIR/photos/`, en JPEG de 512 × 512 pixels, avec une limite de 100 Ko par photo. Les originaux ne sont pas conservés par le serveur.
- Obtenir l'accord des participants avant d'ajouter leurs photos.
- Les portraits ne sont pas servis par une URL publique. Le lien privé du joueur permet toutefois de récupérer le prénom et le portrait de son destinataire après le tirage via l'API : le grattage est une règle d'interface, pas une barrière de sécurité.
- Ne pas partager les liens privés ni publier les données personnelles sur GitHub.
- Conserver et sauvegarder le volume Railway lors des mises à jour. Ne pas remplacer le fichier des événements ni supprimer le dossier des photos.
- Les anciens événements sans photo restent compatibles. Le grattage partiel n'est pas sauvegardé.

## Structure du projet

| Fichier | Rôle |
| --- | --- |
| `server.js` | Serveur HTTP Node.js, API, tirage et stockage |
| `public/app.js` | Interface, recadrage, grattage et animations |
| `public/style.css` | Styles et mise en page responsive |
| `public/index.html` | Page HTML |
| `public/ticket-avant-decouverte.png` | Visuel du ticket |
| `package.json` | Version et commandes npm |

## Historique des versions

| Version | Évolutions |
| --- | --- |
| 5.5 | Chargement du prénom au premier geste, thème défini à la création |
| 5.6 | Exclusions directionnelles ou réciproques, révélation à 95 % |
| 6.0 | Décor hivernal, animations, sons et vibrations |
| 6.1 | Photos facultatives, recadrage manuel et stockage persistant |
| 6.2 | Révélation horizontale, portrait agrandi et fond opaque |
| 6.2 (correctif) | Suppression du pourcentage visible, maintien des messages de chargement et d'erreur |

# 🎁 Secret Santa — première version

Application web responsive, sans framework ni dépendance npm. Node.js 20+ suffit.

## Lancer sur son ordinateur

```bash
node server.js
```

Ouvrir http://127.0.0.1:3000 dans un navigateur.

Pour changer le port : `PORT=8080 node server.js`.

## Partager avec les amis

Pour que des amis sur d'autres réseaux puissent ouvrir leurs liens, il faut héberger cette application sur un serveur Node.js avec **HTTPS et un disque persistant** (VPS avec reverse proxy HTTPS, ou hébergeur Node compatible avec un volume durable). Configurez `HOST=0.0.0.0` et `PORT` selon l'hébergement. Le service de stockage doit préserver le fichier `data/events.json` à chaque redémarrage/redéploiement. Sauvegardez ce fichier en lieu sûr et assurez-vous que le serveur n'expose jamais le dossier `data`.

**Ne transmettez jamais des liens `localhost` ou `127.0.0.1` à vos amis** : ils ne fonctionneront que sur votre ordinateur.

## Architecture

- `public/index.html` — squelette HTML
- `public/style.css` — apparence responsive
- `public/app.js` — création, administration et révélation privées
- `server.js` — API HTTP, tirage cryptographique et stockage local
- `data/events.json` — données générées au premier lancement (non incluses dans l'archive)

Routes API :

- `POST /api/events` : créer un événement et ses participants
- `GET /api/organize/:organizerToken` : récupérer les liens individuels (sans dévoiler les destinataires)
- `POST /api/organize/:organizerToken/draw` : tirage définitif, une seule fois
- `GET /api/gift/:participantToken` : consulter uniquement son propre résultat

## Confidentialité et limites

- Tokens imprévisibles de 256 bits et tirage aléatoire serveur (`crypto.randomInt`).
- Chaque participant n'a accès qu'à son propre destinataire par son lien privé.
- La page organisateur voit tous les liens de partage, mais pas les affectations directement. **L'organisateur pourrait malgré tout ouvrir chaque lien** : il s'agit d'une confidentialité par possession du lien, pas d'une garantie face à un organisateur curieux.
- Les liens doivent être transmis par un canal privé et peuvent être ouverts par toute personne qui les possède. Un lien perdu ou transféré ne peut pas être révoqué dans cette V1.
- Aucun système de compte, aucune notification email, aucune exclusion entre participants, aucun nouveau tirage.
- Le fichier JSON local convient à un petit groupe et à un seul processus serveur, pas à un déploiement réparti en plusieurs instances.
- Pour un usage public à grande échelle : base de données transactionnelle, protection contre les abus, authentification, rotation/révocation des liens, sauvegardes, politiques de conservation et contrôles opérationnels.



## Révélation sous forme de ticket à gratter

Après le tirage, chaque lien `/gift/<token>` affiche un ticket argenté. Le participant
le gratte au doigt (écran tactile) ou à la souris pour découvrir son destinataire.
Une fois environ 42 % de la surface grattée, le revêtement disparaît.
Un bouton « Révéler sans gratter » est disponible pour l’accessibilité.
L'effet est purement visuel : l'URL personnelle est la clé d'accès au résultat.
Rechargez la page pour rejouer l'animation.

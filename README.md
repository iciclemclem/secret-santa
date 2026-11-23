# Secret Santa — Version 2

Application Node.js 20+, sans dépendances tierces, avec liens individuels privés et ticket à gratter tactile.

## Nouveautés

- Animation de confettis lors de la révélation, neige discrète en fond (désactivées en mode réduction des animations).
- Exclusions par paires : empêche deux personnes de se tirer mutuellement. Vérification de faisabilité avant création et algorithme d'appariement garantissant l'absence de doublons et d'auto-attribution.
- Choix d'un thème par événement : Forêt, Rouge & or, Nuit étoilée.
- Liste de souhaits personnelle éditable sur le lien du participant; visible pour la personne qui doit lui offrir un cadeau, après révélation du ticket.

## Démarrer

```bash
node server.js
```

Visitez `http://127.0.0.1:3000` (configurable avec `PORT` et `HOST`).

## Déployer sur Railway

Voir **MISE_A_JOUR_RAILWAY.md**. Gardez le volume existant, configuré avec `DATA_DIR=/data`. Les données et les liens existants sont conservés.

## Sécurité et limites

Les liens sont des secrets d'accès : ne les partagez qu'avec leur destinataire. L'organisateur peut voir tous les liens. La liste de souhaits est modifiable par toute personne ayant accès au lien personnel. Les exclusions sont fixées à la création, pas après tirage. Le serveur suppose un seul processus écrivant dans un volume persistant ; ne déployez pas plusieurs instances parallèles utilisant le même JSON. Les listes de souhaits ne sont pas des messages privés : le destinataire et son donneur peuvent les voir. Ne mettez jamais `events.json` sur GitHub.

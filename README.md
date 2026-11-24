# Secret Santa V5.4

- Le nom et les souhaits du destinataire ne sont transmis par le serveur qu’après la révélation, et restent accessibles ensuite.
- Le grattage attend le chargement de l’image. La zone centrale se découvre progressivement et l’animation se déclenche lorsque tous ses pixels sont effacés. Le bouton d’accessibilité « Révéler sans gratter » reste disponible.
- Le thème des cadeaux (facultatif, 200 caractères) peut être défini à la création ou modifié depuis le tableau organisateur. Il apparaît sur la page participant, même avant le tirage, et la variable WhatsApp `{theme}` est disponible.
- Nuit étoilée est appliqué à tous les écrans. Les textes secondaires sur les cartes claires sont assombris.
- Les anciens événements, messages, liens, souhaits, tirages et dates de révélation sont conservés. Les anciens événements sans thème de cadeaux affichent « Libre ».

Démarrage : `npm start` (Node.js 20+). Tests : `npm test`.

Voir DEPLOIEMENT.md pour la mise à jour Railway. Les tests automatisés serveur et la logique de grattage avec canvas simulé ont été exécutés ; la validation tactile dans un vrai navigateur reste à effectuer.

# Secret Santa V5.5

- Le prénom n’est pas transmis au chargement initial. Dès le premier geste sur la zone grattable, après chargement complet du visuel, une requête privée récupère le prénom seul et l’insère sous la couche à gratter.
- La découverte n’est enregistrée et les confettis/feux d’artifice ne sont lancés qu’à 100 % de grattage (ou via le bouton d’accessibilité). Les souhaits du destinataire sont accessibles à ce moment. Si la connexion échoue au premier geste, les gestes suivants peuvent réessayer ; la réponse de révélation finale fournit aussi le prénom.
- Le grattage incomplet n’est pas sauvegardé. Une fois la découverte enregistrée, le ticket reste révélé après actualisation.
- Le lien privé permet d’interroger le prénom via l’API de préchargement après tirage ; la progression du grattage est une règle d’interface, pas une protection contre l’inspection technique du navigateur.
- Le thème des cadeaux est défini lors de la création uniquement. Il reste visible en lecture seule dans le récapitulatif organisateur, sur la page participant et dans la variable WhatsApp `{theme}`. L’ancienne route de modification est supprimée.
- Les événements, liens, tirages, messages, souhaits et dates de découverte existants restent compatibles.

Démarrage : `npm start` (Node.js 20+). Tests : `npm test`.

Les trois tests automatisés (serveur et logique canvas simulée) passent. Le test de navigation Chromium mobile est bloqué par la politique de l’environnement local ; vérifier le geste tactile sur iPhone après déploiement.

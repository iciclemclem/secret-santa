# Mettre Secret Santa V2 sur Railway sans perdre les tirages

## Préparation et sauvegarde

1. Ne supprimez **ni le projet Railway, ni le service, ni le volume** actuel.
2. Dans Railway, vérifiez que `DATA_DIR=/data` est configuré, que le volume est monté à `/data`, et que l'application fonctionne.
3. **Avant de déployer**, sauvegardez le fichier `/data/events.json` du volume Railway dans un endroit privé, par exemple via une commande exécutée dans un environnement disposant de l'accès au volume. Le fichier contient les liens de tirage secrets : ne le placez jamais dans GitHub, ne l'envoyez jamais dans une conversation ou un dépôt public. Si vous ne savez pas comment le sauvegarder, ne lancez pas la mise à jour avant d'avoir clarifié cette étape.
4. Notez l'adresse de votre lien organisateur et ouvrez un ancien lien de participant, afin de vérifier ces deux liens après mise à jour.

## Déploiement

1. Décompressez `secret-santa-v2.zip`.
2. Dans **le dépôt GitHub existant** connecté à Railway, remplacez les fichiers `server.js`, `public/app.js`, `public/style.css` et les fichiers de documentation par les nouveaux, en respectant les chemins. N'ajoutez pas un niveau de dossier supplémentaire.
3. Enregistrez un commit. Railway redéploie automatiquement si votre projet est connecté au dépôt.
4. Vérifiez que les variables `HOST=0.0.0.0` et `DATA_DIR=/data` sont toujours présentes et que le volume reste monté sur `/data`.
5. Ouvrez l'URL publique et un **ancien lien** avant de créer un nouveau tirage de test.

## Compatibilité

La V2 utilise toujours `/data/events.json` avec le même format de base, les mêmes tokens et les mêmes liens `/organize/<token>` et `/gift/<token>`. Les nouveaux champs (`theme`, `exclusions`, `wishlist`) sont facultatifs pour les anciens événements. Aucun effacement ni migration destructive automatique.

La liste de souhaits est modifiable par toute personne possédant le lien personnel correspondant. La liste du destinataire est accessible depuis le lien personnel du donneur. Les exclusions sont définies à la création, pour les nouveaux événements uniquement, et ne peuvent pas modifier les tirages déjà effectués. L'organisateur garde accès à tous les liens privés.

## En cas de problème

Consultez **Deploy Logs** Railway et rétablissez le commit GitHub précédent (revert) si nécessaire, en conservant le volume intact. Une restauration de `events.json` ne devrait être nécessaire qu'en cas de corruption ou perte de données, pas pour une simple erreur d'interface.

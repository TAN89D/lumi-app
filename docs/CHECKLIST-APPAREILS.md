# LUMI V3.1 — Checklist de tests sur appareils réels

Ces tests **n'ont pas été réalisés** (aucun téléphone, tablette ni lecteur d'écran n'était disponible pendant le développement).
L'automatisation (Playwright) ne fait qu'**émuler** la taille d'écran et le moteur de rendu : elle ne remplace pas ces vérifications.
Cochez chaque ligne et notez l'appareil, la version du système et la date.

Adresse de test : une **prévisualisation** (jamais la production), qui affiche le bandeau violet « PRÉVISUALISATION ».

## A. Android (téléphone) — Chrome, puis le navigateur de l'appareil
- [ ] L'accueil s'affiche, les 11 panneaux sont touchables, aucun texte coupé, pas de défilement horizontal
- [ ] Un jeu « choisir » se joue ; un jeu « glisser » (formes, bateau) fonctionne au doigt ; le tracé d'une lettre fonctionne
- [ ] **Voix** : la consigne est lue en français ; aucune phrase n'est lue en anglais ; volume du téléphone et curseur parent respectés
- [ ] Passage en anglais (espace parent) : consignes et histoires lues en anglais ; si la voix anglaise manque, le message explicite apparaît
- [ ] Mode avion : fermer complètement l'application, la rouvrir → elle démarre et se joue
- [ ] Installation : proposition automatique ou instructions adaptées au navigateur
- [ ] Enregistrement de sa propre voix : autoriser le micro, enregistrer une phrase, la réécouter, relancer l'application → la phrase est toujours là
- [ ] Rotation de l'écran sans perte de la partie en cours
- [ ] Effacement total depuis l'espace parent : tout disparaît, y compris les enregistrements vocaux

## B. iPhone — Safari (et « Ajouter à l'écran d'accueil »)
- [ ] Mêmes vérifications que A
- [ ] Le **son se déclenche** après le premier toucher (contrainte d'iOS)
- [ ] Les voix françaises disponibles sont proposées dans « Choisir la voix »
- [ ] Zone sûre (encoche, barre du bas) : rien n'est masqué
- [ ] Hors ligne après installation sur l'écran d'accueil

## C. Tablette (Android et iPad), portrait et paysage
- [ ] 3 colonnes de catégories en portrait, mise en page lisible en paysage
- [ ] Glisser-déposer et tracé précis au doigt et, si possible, au stylet
- [ ] Les zones tactiles sont assez grandes pour un enfant de 3 ans

## D. Lecteurs d'écran
- [ ] **TalkBack (Android)** : la navigation annonce les boutons de la barre du bas, les catégories, les jeux, les tuiles de réponse, le bouton « quitter » ; la porte parentale est utilisable
- [ ] **VoiceOver (iPhone/iPad)** : mêmes vérifications ; le glisser-déposer propose l'alternative « toucher l'objet puis la place »
- [ ] L'ordre de lecture est logique ; aucune annonce en double pendant que la consigne est lue à voix haute

## E. Parcours parent
- [ ] Porte : maintien 2 s puis addition ; 3 erreurs → blocage 30 s ; fermeture après 2 minutes d'inactivité
- [ ] Création, changement d'âge, suppression d'un profil
- [ ] Export, puis import (fusion et remplacement) d'une sauvegarde V1 et d'une sauvegarde V2
- [ ] Limite de la journée : verrouillage, déverrouillage par un adulte (+10 min)
- [ ] Conseils et compétences compréhensibles par un parent qui n'a pas vu l'application

## Résultats

| Appareil | Système | Navigateur | Date | A | B | C | D | E | Remarques |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

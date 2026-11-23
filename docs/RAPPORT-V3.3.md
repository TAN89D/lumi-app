# LUMI V3.3 — Refonte visuelle premium (rapport de livraison)

Branche `v3.3-premium` → Pull Request vers `main`. **Aucun déploiement automatique** : la production reste en V3.2 tant que la PR n'est pas fusionnée après validation.

## Ce qui est livré (par écran de la maquette)

| # | Écran | Réalisation |
|---|---|---|
| 1 | Bienvenue | Nouvel écran `welcome` : logo LUMI avec plaque en bois, slogan, illustration de Lumi et des deux enfants (légère animation de flottement), message « Bienvenue ! Prêt(e) à apprendre, jouer et explorer le monde avec nous ? », grand bouton vert « Commencer », accès « Espace parents » (porte parentale existante). Affiché **une fois par ouverture** ; les onglets n'y ramènent jamais. |
| 2 | Tableau de bord | Conservé et affiné (V3.2) : profil, âge, étoiles réelles, mission du jour, progression, 8 univers + Récré, 4 onglets. Cartes avec apparition échelonnée. |
| 3 | Activité | Personnage-guide illustré + **vraie bulle de consigne** (texte réel, traduit, cliquable pour réécouter) pour les exercices à choix ; tuiles à fort relief, retour tactile. Règles de validation inchangées. |
| 4 | Réussite | Lumi qui exulte, « Bravo [Prénom] ! », 0 à 3 étoiles **exactement égales au résultat réel**, récompense éventuelle, confettis (désactivés en mode calme), bouton « Continuer ». |
| 5 | Histoires | Mise en page « livre illustré » : titre, page x sur y, barre de progression de lecture, texte, boutons précédent / écouter / pause / suivant. Histoires, langue et audio existants. |
| 6 | Espace parents | Quatre onglets : **Suivi** (conseils, compétences, progression), **Limites** (temps de jeu, pause, verrouillage), **Contenus** (profils, ma voix), **Paramètres** (langue, voix, accessibilité, sauvegarde/restauration, suppression des données). Données réelles du stockage ; porte parentale inchangée. |
| 7 | Profils | Nouvelle page : liste avec avatar, prénom, âge, sélection, « Créer un profil ». Modification et suppression restent dans l'espace parents (protégé). |
| 8 | Paramètres | Dans l'onglet Paramètres des parents : langue FR/EN fonctionnelle, Bamanankan et Español indiqués « Bientôt », effets sonores, voix, mode calme, contraste, taille du texte, limites, sauvegarde, suppression (confirmation explicite, résultats réels). |

## Technique

- Fichiers modifiés : `js/main.js`, `js/home.js`, `js/i18n.js`, `css/design.css`, `sw.js` (version `3-3-0`), tests.
- Nouvelles illustrations indépendantes (`assets/img/guide-boy.jpg`, `lion-cheer.jpg`), optimisées (< 60 Ko chacune), mises en cache hors ligne. Aucun écran complet de la maquette n'est utilisé comme interface : boutons, bulles, onglets, cartes, barres et textes sont du HTML/CSS réel.
- Animations légères (transform/opacity seulement), coupées par `prefers-reduced-motion` et par le mode calme.
- Données, clés de stockage, schéma, sauvegardes : inchangés (compatibles V2/V3.1/V3.2).

## Tests

- Page de tests intégrée : **183 tests, 183 réussis** (navigateur intégré), dont un groupe V3.3 (bienvenue unique, étoiles affichées = étoiles gagnées, profils, quatre sections parents, « Bientôt », illustrations légères et en cache, animations coupées).
- Playwright (Chromium, Pixel 7, iPhone 14 WebKit, iPad WebKit) : voir la dernière exécution de la PR ; les captures (bienvenue, accueil, jeux, monde, jeu, profils, parents) sont jointes à l'artefact `rapport-playwright`.

## Limites honnêtes

- Les personnages viennent de l'illustration fournie (non détourée) : affichés en bandeau/zone avec fondu, pas en éléments entièrement indépendants. Les animations sont un flottement léger, pas un squelette (pas de patte qui salue image par image, pas de clignement des yeux).
- Le personnage-guide s'affiche pour les exercices à choix (lettres, images…). Les autres types d'exercices (glisser-déposer, tracé, mémoire…) gardent leur bandeau de consigne restylé.
- Chaque exercice utilise le même garçon-guide (pas encore de guide différent par univers).
- Pas de choix interactifs ni de questions de compréhension ajoutés aux histoires (« progressivement » : prévu pour une version suivante, sans toucher au sens des contes).
- Pas de test sur appareil réel, ni TalkBack / VoiceOver.
- Sections « Contenus » : gestion des profils et voix ; pas de filtrage de contenu au-delà du filtre d'âge existant.

## Mise en ligne (à décider après validation)

1. Relire la PR et les captures. 2. Tester sur un téléphone. 3. Fusionner : GitHub Pages publie ; le cache se renouvelle (`3-3-0`) sans effacer les données. Retour arrière : annuler la fusion.

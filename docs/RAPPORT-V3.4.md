# LUMI V3.4 — Personnages vivants et histoires interactives (rapport)

Pull Request vers `main`, **sans fusion automatique**. À valider avant toute mise en production.

## Fonctions développées

### 1. Lumi, mascotte vectorielle animée (`js/mascot.js`)
- Personnage **SVG découpé en parties animables** : corps, tête (crinière, bandeau), deux oreilles, deux yeux avec paupières, sourcils, quatre bouches (repos, parole, joie, erreur douce) et **deux pattes indépendantes**. Aucune photo n'est « animée ».
- Mêmes couleurs que la mascotte validée (crinière brune, visage doré, museau crème, tenue à motifs) ; la mascotte illustrée du héros de l'accueil est conservée telle quelle.
- États : **repos** (respiration, clignement), **salut** (patte levée qui salue), **parole** (bouche synchronisée sur la voix), **bonne réponse** (sourire, oreilles qui bougent, sourcils), **erreur douce** (tête penchée, sourcils tendres), **récompense** (deux pattes levées, petit saut).
- Synchronisation avec la narration : `Sound.onSpeaking` (nouveau, dans `audio.js`) prévient quand une voix commence ou s'arrête ; la bouche bouge seulement pendant la parole.
- **Repli statique** : sous `prefers-reduced-motion` et en mode calme, toutes les boucles sont coupées ; les poses restent (la pose de fête reste « pattes levées », sans mouvement).
- Où elle apparaît : bienvenue (salue), page d'histoire (« lit » le conte), question de compréhension (réagit aux réponses), écran de réussite (fête). Si le module est absent, l'image fixe de la V3.3 reste affichée.

### 2. Questions de compréhension des dix histoires (`js/story-quiz.js`)
- Une question après la dernière page de **chacune des dix histoires**, en **français et anglais** (questions, réponses, consignes vocales). Les textes des contes ne sont pas modifiés, les fins traditionnelles non plus.
- 3 ans : **2 réponses** ; 4 et 5 ans : **3 réponses**. Une seule bonne réponse, qui change de place à chaque tirage.
- Bonne réponse : encouragement (voix + Lumi content) puis fin de l'histoire. Mauvaise réponse : message doux, **aucune pénalité** (pas d'erreur comptée, pas d'étoile retirée), on peut réessayer. Bouton **« Passer »** toujours disponible.
- Réécoute de la question (bouton haut-parleur de la bulle). Changement d'écran = arrêt de la voix. Une narration en attente est annulée à l'arrêt ; l'enregistrement d'un adulte est mis en pause avant toute voix de synthèse (jamais deux voix en même temps).
- Aucune donnée nouvelle n'est enregistrée : **le schéma de stockage ne change pas** (aucune migration).
- Si aucune voix compatible n'existe : le message d'alerte existant s'affiche et la question reste lisible à l'écran (alternative textuelle).

### 3. Mini-jeux
Les jeux existants et leurs règles sont **inchangés**. Beaucoup des pistes demandées existaient déjà (lettres : écoute, glisser, tracé ; nombres : comptage, panier, addition, tracé ; formes : construction, tri ; musique : mélodie à répéter ; nature : animaux, habitat, mémoire). Ajout : **Nombres › « Trouve le bon groupe »** (quantités à associer : un chiffre, 2 ou 3 groupes de mangues ; même plafond d'âge que le comptage). Pas de nouvelle récompense ni de mécanisme incitant à jouer sans fin.
Non fait dans cette version : nouveaux jeux pour les formes (classement forme + couleur), la musique (échos rythmiques) et la nature (sons d'animaux enregistrés) — voir recommandations.

## Fichiers
- **Créés** : `js/mascot.js`, `js/story-quiz.js`, `docs/RAPPORT-V3.4.md`.
- **Modifiés** : `js/main.js` (quiz, montage de la mascotte), `js/home.js` (composants quiz et emplacements de Lumi), `js/audio.js` (état « la voix parle », pas de chevauchement), `js/games.js` + `js/skills.js` (nouveau jeu), `js/i18n.js` (FR/EN), `css/design.css`, `index.html`, `sw.js` (version `3-4-0`, nouveaux fichiers en cache), `tests/tests.js`, `tests/index.html`, `tests/e2e/lumi.spec.js`.

## Tests (résultats réels)
- Page de tests intégrée exécutée dans le navigateur intégré : **208 tests, 208 réussis**, dont les groupes V3.4 : mascotte (parties, six états, retour au repos, synchronisation parole, animations coupées en réduit/calme, pas de fuite), dix histoires × 2 langues × 3 âges (question non vide, bonne réponse prouvée par le texte, aucun distracteur dans le texte, une seule bonne réponse, 2/3 choix), répartition de la bonne réponse, déroulement (réessayer sans pénalité, répondre, passer, progression et étoiles, réglages parentaux intacts, arrêt de la voix, narration annulée), cache hors ligne.
- Un test du service worker échoue **seulement** dans un navigateur où une ancienne installation de LUMI contrôle déjà la page de test (artefact du navigateur local, pas de l'application) ; il passe dans un navigateur propre, comme dans la CI.
- Playwright (Chromium, Pixel 7, iPhone 14 WebKit, iPad WebKit) : à lire sur la dernière exécution de la PR. **Je ne déclare pas ces tests réussis tant que la CI n'a pas fini.** Trois nouveaux parcours y sont ajoutés (question et réessai, passer, mascotte animée puis immobile en animations réduites). Les captures (bienvenue avec Lumi, quiz…) sont jointes à l'artefact `rapport-playwright`.

## Problèmes non résolus / limites
- La CI de la V3.2 avait vu la page de tests intégrée ne pas se terminer ; la cause n'a pas été identifiée. Un diagnostic (dernier groupe démarré) est en place.
- Lumi vectorielle est un nouveau dessin proche de la mascotte validée, pas une copie : elle est plus simple que l'illustration raster. Elle ne remplace pas l'illustration du héros de l'accueil.
- Animations simples (transformations CSS), pas d'animation squelettique ; pas de synchronisation phonème par phonème (la bouche bouge pendant la voix).
- Les émojis des réponses dépendent de la police du téléphone (🪕 pour la kora : très ancien Android = carré vide possible ; le libellé texte reste toujours affiché).
- Un seul personnage-guide dans les exercices, la mascotte n'y apparaît pas.
- Aucun essai sur appareil réel, ni TalkBack / VoiceOver ; voix de synthèse différentes selon l'appareil.
- Pas de questions de compréhension à choix multiples avancées, ni de choix narratifs (volontairement, pour ne pas modifier les contes).

## Recommandations pour la V3.5
Faire relire les questions par un adulte de chaque langue ; tester Lumi sur 2 téléphones Android modestes et 1 iPhone ; ajouter les jeux manquants (formes forme + couleur, échos rythmiques, sons d'animaux enregistrés) ; mettre Lumi dans les exercices à la place du garçon-guide pour les lettres ; mesurer l'utilisation mémoire/CPU des animations ; envisager des voix enregistrées par histoire.

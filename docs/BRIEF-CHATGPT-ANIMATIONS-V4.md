# LUMI V4 — Brief complet à donner à ChatGPT (animations, images, logo, décors)

Mode d'emploi : coller d'abord le **PROMPT MAÎTRE** (section 1) dans une nouvelle conversation, puis envoyer les assets **un groupe à la fois** (sections 3 à 9). Pour garder les personnages cohérents : générer d'abord la **planche de référence** (asset `REF-01`), puis la rejoindre comme image de référence à chaque demande.
Livraison attendue par asset : PNG **fond transparent** (jamais de fond blanc ni de damier dessiné), nommé exactement comme dans la liste.

---

## 1. PROMPT MAÎTRE (à coller en premier)

> Tu es l'illustrateur de **LUMI — J'apprends en jouant**, une application éducative pour enfants de 3 à 8 ans, ambiance **Afrique de l'Ouest**, jamais de violence ni de peur.
> Style unique pour TOUT : **cartoon 3D premium « Pixar-like »**, volumes doux, contours arrondis, lumière chaude du matin, couleurs vives mais harmonieuses, expressions très lisibles, proportions mignonnes (grosse tête, grands yeux).
> Palette : bleu ciel `#3fa9f2`, jaune doré `#ffd62e`, vert `#3fb52a`, violet `#7b3fc4`, rose `#ff5fa8`, orange `#f28c1b`, crème `#fff6df`, terre `#c98a47`, brun crinière `#b8631f`.
> Personnages fixes : **Lumi** (petit lion doré, crinière brun-roux, bandeau à motifs rouge/jaune, tenue à triangles colorés), **Abdou** (garçon, casquette bleue à motifs, sac à dos bleu), **Awa** (fillette, tresses avec perles colorées, robe jaune/violette).
> Règles techniques : fond **100 % transparent**, sujet centré, marge de sécurité de 8 %, aucun texte dans l'image (les textes sont ajoutés par l'application), aucune marque, aucun personnage réel. Cohérence stricte : mêmes couleurs, mêmes proportions, mêmes visages d'une image à l'autre.
> Pour les animations : **planches de sprites** (frames en grille, même cadre, même position du personnage dans chaque case, boucle fluide).
> Dis-moi « prêt » puis attends ma première demande.

---

## 2. Conventions de livraison

| Type | Format | Taille d'une image | Poids max |
|---|---|---|---|
| Personnage / objet fixe | PNG transparent | 1024×1024 | 250 Ko après compression |
| Planche d'animation | PNG transparent, grille régulière, **sans espace entre les cases** | case 512×512 (petits objets : 256×256) | 600 Ko |
| Décor plein écran portrait | PNG ou WebP, transparent sauf ciel | 1080×1920 (mobile) **et** 1536×2048 (tablette) | 350 Ko |
| Bordure / motif répétable | PNG transparent, **se raccorde à gauche/droite** | 1080×360 | 150 Ko |
| Logo | PNG transparent + version fond clair + version fond sombre | 2048×2048 puis 1024×1024 | 300 Ko |
| Icône application | PNG | 192, 512 ; version « maskable » (sujet dans les 80 % centraux) | 60 Ko |

Nom de fichier : `categorie-nom-etat-NxM.png` où NxM = colonnes×lignes de la planche (ex. `lumi-wave-4x2.png` = 4 colonnes, 2 lignes, 8 images). Cadence indicative : 8 images/seconde (boucle de 1 s), sauf mention.

Règle d'or : chaque planche doit **boucler sans saut** (dernière image proche de la première) sauf indication « une fois ».

---

## 3. Planche de référence (à générer EN PREMIER)

| ID | Contenu |
|---|---|
| REF-01 | Planche de personnages de face, 3/4 et de profil : Lumi, Abdou, Awa, côte à côte, même échelle |
| REF-02 | Lumi : feuille d'expressions (neutre, content, très content, surpris, triste doux, réfléchit, fier, endormi) |
| REF-03 | Abdou et Awa : feuille d'expressions (6 chacun) |
| REF-04 | Nouveaux personnages (âges 6-8) : **Moussa** (garçon de 8 ans, short, ballon), **Fanta** (fillette de 7 ans, cartable), **grand-mère conteuse** (pagne, foulard), **grand-père griot** (kora, boubou) |

---

## 4. Animations de Lumi (planches de sprites)

| ID | Fichier | Frames | Description |
|---|---|---|---|
| L-01 | `lumi-idle-4x2.png` | 8 | repos : respiration douce, clignement des yeux à l'image 5-6 |
| L-02 | `lumi-wave-4x2.png` | 8 | salue de la patte droite, grand sourire |
| L-03 | `lumi-talk-4x1.png` | 4 | 4 formes de bouche (fermée, mi-ouverte, ouverte, « o ») pour la parole, tête immobile |
| L-04 | `lumi-happy-4x2.png` | 8 | bonne réponse : sourire, oreilles qui bougent, petit hochement |
| L-05 | `lumi-oops-4x1.png` | 4 | erreur douce : tête penchée, sourcils tendres, geste d'encouragement (jamais triste/effrayé) |
| L-06 | `lumi-cheer-4x2.png` | 8 | récompense : saute, deux pattes en l'air |
| L-07 | `lumi-think-4x2.png` | 8 | réfléchit : patte au menton, bulle vide animée |
| L-08 | `lumi-point-4x1.png` | 4 | montre du doigt/patte la zone de jeu (consigne) |
| L-09 | `lumi-dance-6x2.png` | 12 | danse (musique, fin de niveau) |
| L-10 | `lumi-read-4x2.png` | 8 | lit un livre, tourne la page |
| L-11 | `lumi-sleep-4x2.png` | 8 | s'endort (pause / limite de temps du jour atteinte), « Zzz » séparés |
| L-12 | `lumi-run-6x1.png` | 6 | court (transitions d'écran, course) |
| L-13 | `lumi-listen-4x1.png` | 4 | main à l'oreille (« écoute bien ») |
| L-14 | `lumi-clap-4x1.png` | 4 | applaudit |
| L-15 | `lumi-yawn-4x2.png` | 8 | pause conseillée : s'étire, bâille |
| L-16 | `lumi-wow-4x1.png` | 4 | surpris, yeux brillants (nouveau déblocage) |

## 5. Autres personnages (mini-animations en boucle)

| ID | Fichier | Frames | Description |
|---|---|---|---|
| P-01 | `abdou-idle-4x2.png` | 8 | repos, respire, cligne |
| P-02 | `abdou-point-4x1.png` | 4 | montre du doigt (guide d'activité) |
| P-03 | `abdou-cheer-4x2.png` | 8 | bras levés de joie |
| P-04 | `abdou-think-4x1.png` | 4 | réfléchit |
| P-05 | `awa-idle-4x2.png` | 8 | repos, tresses qui bougent légèrement |
| P-06 | `awa-point-4x1.png` | 4 | guide |
| P-07 | `awa-cheer-4x2.png` | 8 | saute de joie |
| P-08 | `awa-dance-6x2.png` | 12 | danse |
| P-09 | `moussa-idle-4x2.png`, `moussa-point-4x1.png`, `moussa-cheer-4x2.png` | 8 / 4 / 8 | nouveau guide 6-8 ans |
| P-10 | `fanta-idle-4x2.png`, `fanta-point-4x1.png`, `fanta-cheer-4x2.png` | 8 / 4 / 8 | nouveau guide 6-8 ans |
| P-11 | `grandmere-tell-4x2.png` | 8 | conteuse qui parle avec les mains (histoires) |
| P-12 | `griot-kora-4x2.png` | 8 | griot qui joue de la kora, notes qui s'envolent |
| P-13 | `anansi-walk-4x2.png`, `anansi-idle-4x1.png` | 8 / 4 | araignée Anansi (rigolote, pas effrayante) |
| P-14 | `tortue-idle-4x1.png`, `tortue-fly-4x2.png` | 4 / 8 | la tortue (conte) qui vole avec les plumes |
| P-15 | `lievre-jump-4x2.png` | 8 | le lièvre malin |
| P-16 | `elephant-idle-4x2.png`, `elephant-spray-4x2.png` | 8 / 8 | éléphant, éclaboussure de trompe |
| P-17 | `hippo-idle-4x2.png` | 8 | hippopotame qui sort de l'eau |
| P-18 | `singe-swing-4x2.png` | 8 | singe qui se balance |
| P-19 | `perroquet-fly-4x2.png` | 8 | perroquet qui vole en boucle |
| P-20 | `girafe-idle-4x2.png`, `zebre-idle-4x2.png`, `lion-roar-soft-4x2.png` (rugissement mignon), `crocodile-idle-4x2.png` (gentil), `flamant-idle-4x2.png`, `serpent-idle-4x1.png` (gentil), `poisson-swim-4x2.png` | 8 chacun | animaux de la catégorie Nature (réaction quand l'enfant les touche) |

## 6. Mini-animations d'interface et de récompense

| ID | Fichier | Frames | Description |
|---|---|---|---|
| U-01 | `etoile-pop-4x2.png` | 8 | une étoile dorée qui apparaît avec rebond (une fois) |
| U-02 | `etoile-brille-4x2.png` | 8 | étoile qui scintille (boucle) |
| U-03 | `etoile-grise-4x1.png` | 4 | étoile vide qui se remplit |
| U-04 | `confettis-6x3.png` | 18 | pluie de confettis africains colorés (papier + perles), 1 passage, 24 fps |
| U-05 | `feu-artifice-5x2.png` | 10 | feux d'artifice doux (réussite 3 étoiles) |
| U-06 | `etincelles-4x2.png` | 8 | étincelles autour d'un bouton ou d'un objet gagné |
| U-07 | `coffre-ouvre-4x3.png` | 12 | coffre/calebasse-trésor qui s'ouvre (récompense), une fois |
| U-08 | `calebasse-ouvre-4x2.png` | 8 | calebasse décorée qui s'ouvre sur une lumière |
| U-09 | `badge-gagne-4x2.png` | 8 | médaillon qui tourne et brille (nouveau badge) |
| U-10 | `niveau-monte-5x2.png` | 10 | « niveau supérieur » : flèche + étoiles qui montent (sans texte) |
| U-11 | `bouton-start-pulse-4x1.png` | 4 | halo qui pulse autour du bouton « Commencer » |
| U-12 | `coche-verte-4x1.png` | 4 | grosse coche qui se dessine (bonne réponse) |
| U-13 | `croix-douce-4x1.png` | 4 | marque douce orange (essaie encore) : jamais de croix rouge agressive |
| U-14 | `chargement-lumi-6x1.png` | 6 | petit lion qui trotte en boucle (chargement) |
| U-15 | `transition-feuilles-5x2.png` | 10 | grandes feuilles qui balayent l'écran (changement de page), 1 passage |
| U-16 | `transition-tambour-4x2.png` | 8 | onde de tambour (changement d'écran) |
| U-17 | `nuages-defilent-1x1.png` | 1 | bande de nuages répétable horizontalement (défilement lent) |
| U-18 | `papillons-4x2.png`, `oiseaux-4x2.png`, `lucioles-4x2.png` | 8 | ambiance vivante en fond (opacité faible) |
| U-19 | `soleil-rayons-4x2.png` | 8 | soleil dont les rayons respirent (haut de l'accueil) |
| U-20 | `pluie-4x2.png`, `arc-en-ciel-4x2.png` | 8 | pour l'histoire « La pluie arrive » et les questions associées |
| U-21 | `note-musique-4x2.png` | 8 | notes qui s'envolent (jeux de musique) |
| U-22 | `fleche-doigt-4x1.png` | 4 | main/doigt qui montre où toucher (aide à 3 ans) |
| U-23 | `sablier-lumi-4x2.png` | 8 | petite pause conseillée (sans stress) |
| U-24 | `mission-du-jour-4x2.png` | 8 | icône de mission qui brille |
| U-25 | `carte-monde-pulse-4x1.png` | 4 | repère d'étape clignotant sur la carte d'aventure |

---

## 7. Décors africains DERRIÈRE tous les jeux (le « trop de vide »)

Principe : l'application garde une **zone centrale calme** (là où l'enfant joue) et ajoute de la vie sur les **bords et en bas**. Chaque décor existe en **3 couches transparentes** pour permettre un léger défilement : `…-ciel` (dégradé), `…-loin` (collines, silhouettes), `…-proche` (bordures détaillées en bas et sur les côtés). Zone centrale (60 % du centre) **dégagée ou très peu contrastée**.

| ID | Monde / écran | Éléments à dessiner |
|---|---|---|
| D-01 | Accueil / bienvenue | grand baobab, village de cases rondes, acacias, chemin de terre, lumière du matin |
| D-02 | Lettres et sons | tableau d'école sous un baobab, lettres en bois dans l'herbe, crayons géants, oiseaux |
| D-03 | Nombres et calcul | marché africain : étals de mangues, bananes, noix de coco, balances en bois, paniers |
| D-04 | Formes et logique | motifs **bogolan/kente** géométriques (losanges, triangles, zigzags) en bordure, perles, calebasses |
| D-05 | Couleurs et dessin | tissus colorés qui sèchent (pagnes, wax), pots de peinture naturelle, fleurs d'hibiscus |
| D-06 | Musique et rythmes | scène de village au crépuscule : djembé, balafon, kora, calebasses-percussions, lanternes |
| D-07 | Nature et animaux | savane : acacias, rivière, termitière, hautes herbes, soleil bas, silhouettes d'animaux |
| D-08 | Pays d'Afrique | carte d'Afrique stylisée en parchemin, boussole, baobab, drapeaux en guirlande |
| D-09 | Histoires et contes | **veillée sous le baobab** : feu de camp doux, étoiles, grand arbre, esprit contes (calme) |
| D-10 | Récré (moto/course) | piste de terre rouge, dunes, horizon de savane, panneaux en bois |
| D-11 | Espace parents | fond sobre : motifs bogolan très discrets, beaucoup d'espace |
| D-12 | Profils / paramètres | frise bogolan en haut, savane lointaine en bas |
| D-13 | Résultats / récompenses | ciel de fête avec rayons, bannière de tissu, feuilles tropicales |
| D-14 | Pause / limite de temps | nuit étoilée douce, Lumi endormi sous un arbre |
| D-15 | Jeux 6-8 ans (« Grand explorateur ») | mêmes lieux, mais plus « aventure » : jungle, fleuve Niger, désert du Sahara, pyramides, marché de ville |

Éléments détachés (PNG transparent 512×512, à poser librement) : `deco-baobab`, `deco-acacia`, `deco-palmier`, `deco-case`, `deco-case-conique`, `deco-grande-case`, `deco-puits`, `deco-calebasse` (3 décorations), `deco-djembe`, `deco-kora`, `deco-balafon`, `deco-masque` (**stylisé et respectueux**, pas sacré), `deco-panier`, `deco-pagne-1…4`, `deco-fleur-hibiscus`, `deco-fleur-bissap`, `deco-fruit-mangue/papaye/ananas/banane`, `deco-herbe-1…3`, `deco-pierre`, `deco-termitiere`, `deco-feu-camp`, `deco-lanterne`, `deco-etoile-nuit`, `deco-nuage-1…3`, `deco-papillon`, `deco-oiseau-tisserin`.

Bordures **répétables** (1080×360, se raccordent) : `bordure-bogolan-1…4`, `bordure-kente-1…3`, `bordure-perles`, `bordure-herbe`, `bordure-feuilles`, `bordure-cases`, `bordure-acacias`.

---

## 8. Nouveau logo et identité

Intention : plus premium, reconnaissable en petit (icône), cohérent avec la mascotte. Garder **« LUMI »** en grosses lettres jaune doré bien lisibles, et le slogan « J'apprends en jouant ».

| ID | Fichier | Description |
|---|---|---|
| G-01 | `logo-lumi-principal.png` | wordmark « LUMI » 3D jaune doré, contour brun, lion Lumi qui se lève derrière/au-dessus du « U » ou du « I », plaque en bois dessous pour le slogan (texte du slogan **vide** : on l'ajoute en code) |
| G-02 | `logo-lumi-sans-slogan.png` | idem sans plaque |
| G-03 | `logo-lumi-clair.png`, `logo-lumi-sombre.png` | versions pour fond clair et fond sombre |
| G-04 | `logo-embleme.png` | seulement la tête de Lumi dans un médaillon rond doré (pour l'icône) |
| G-05 | `icone-192.png`, `icone-512.png` | icône d'application (fond plein bleu ciel ou doré, tête de Lumi centrée) |
| G-06 | `icone-maskable-512.png` | idem avec le sujet dans les 80 % centraux (rognage Android) |
| G-07 | `splash-1080x1920.png` | écran de démarrage : logo + Lumi qui salue, ciel, baobab |
| G-08 | `logo-anime-5x3.png` | animation du logo à l'ouverture : les lettres tombent avec rebond, Lumi apparaît, étincelles (15 images, 1 passage) |
| G-09 | `favicon-64.png`, `favicon-32.png` | version minuscule, très lisible |
| G-10 | `logo-monochrome.svg` ou PNG noir/blanc | pour impression |

Donner **3 propositions de logo** différentes avant de choisir (A : lion + lettres ; B : médaillon rond ; C : lettres seules avec calebasse).

---

## 9. Images pour les nouveaux niveaux 6-8 ans (voir section 10)

| ID | Fichier | Contenu |
|---|---|---|
| N-01 | `avatar-moussa.png`, `avatar-fanta.png`, `avatar-ibrahim.png`, `avatar-mariam.png`, `avatar-seydou.png`, `avatar-aicha.png` | six nouveaux portraits ronds (garçons et filles, 6 à 8 ans), mêmes styles que Abdou/Awa |
| N-02 | `badge-niveau-3.png` … `badge-niveau-8.png` | médaillon par âge (3, 4, 5, 6, 7, 8) : même forme, motif et couleur différents ; lion de plus en plus « explorateur » |
| N-03 | `titre-petit-lion.png`, `titre-jeune-lion.png`, `titre-grand-lion.png`, `titre-explorateur.png`, `titre-sage-baobab.png` | 5 grades de progression (médaillons) |
| N-04 | `horloge-jeu-1…4.png` | horloge à aiguilles lisible (jeux « lire l'heure », 7-8 ans) : 12 positions en planche `horloge-12x1.png` |
| N-05 | `pieces-fcfa-1x6.png` | pièces et billets **stylisés non officiels** (5, 10, 25, 50, 100, 500) pour compter l'argent |
| N-06 | `carte-afrique-pays-6x9.png` | planche de silhouettes de pays (au moins 24 pays) à associer avec leurs drapeaux |
| N-07 | `animaux-silhouettes-6x4.png` | silhouettes d'animaux pour jeux d'ombres |
| N-08 | `syllabes-cartes-6x4.png` | cartes illustrées (objet + syllabe vide) pour la lecture |
| N-09 | `regle-longueur.png`, `balance.png`, `thermometre.png`, `calendrier-vide.png` | objets de mesure pour les jeux 7-8 ans |
| N-10 | `quete-etape-1…8.png` | 8 vignettes d'étapes du « Voyage de Lumi » (voir section 10, C) |

---

## 10. Ce que je (Claude) vais coder en parallèle — décisions à valider

### A. Monter le niveau de 3 à 8 ans
- Profil enfant : âge de **3 à 8** (aujourd'hui 3 à 5). Les profils existants (3-5) restent intacts : **aucune donnée perdue**, simple extension de la plage.
- Six paliers : 3, 4, 5, 6, 7, 8 ans. Chaque jeu a un **niveau minimal** et s'adapte par palier (nombre de choix, taille des nombres, vitesse).
- Contenu nouveau par domaine :
  - **Lettres** : syllabes, mots à reconstituer, dictée d'images, premières phrases à compléter, rimes.
  - **Nombres** : additions/soustractions jusqu'à 20 puis 100, tables de 2/5/10, comparer, suites de nombres, monnaie (FCFA), lire l'heure.
  - **Formes et logique** : symétrie, patrons, labyrinthes simples, mini-sudoku 4×4, suites logiques à plusieurs règles.
  - **Nature** : classer vertébrés/oiseaux/poissons, chaînes alimentaires simples, cycle de l'eau, plantes.
  - **Pays d'Afrique** : placer les pays sur la carte, capitales, fleuves et montagnes, drapeaux (déjà en place pour les plus jeunes).
  - **Histoires** : contes plus longs avec plusieurs questions de compréhension, déduction (« pourquoi… ? »), morale à reformuler.
  - **Musique** : séquences rythmiques plus longues, mémoriser des mélodies.
- Écran d'âge et recommandations pour les parents (par compétence) adaptés à 6-8 ans.

### B. Contre l'ennui au bout de quelques minutes
Constat : les enfants jouent une manche courte, puis recommencent le même type d'exercice. Pistes (aucune ne pousse à jouer sans fin ; les limites de temps parentales restent prioritaires) :
1. **Séance variée automatique** : « Commencer » enchaîne 4 à 5 activités **différentes** (une de chaque famille), pas 5 fois la même.
2. **Difficulté adaptative douce** : si l'enfant réussit 3 fois, la suite monte d'un cran ; s'il hésite, elle redescend.
3. **Petites surprises** : une mini-animation aléatoire (Lumi qui danse, un animal qui passe) après certaines réussites.
4. **Variété d'interactions** : glisser, toucher, tracer, écouter-répéter, mémoire, puzzle, mini-course.
5. **« Le Voyage de Lumi »** (section C).
6. **Fin de séance claire** : après ~10 minutes, Lumi propose une pause (un joli signal de fin, pas un blocage) ; les limites des parents s'appliquent toujours.
7. **Défi du jour** (la mission existe déjà) avec une variété plus grande.

### C. Le Voyage de Lumi (nouveau mode, proposé)
Une carte d'Afrique stylisée avec 8 étapes (une par monde). Chaque étape = une petite séance variée de 3 activités + une mini-histoire. On gagne un **autocollant** (collection), jamais de classement ni de pression. À valider avec vous.

### D. Décors partout
Chaque écran de jeu reçoit son décor (section 7) en 3 couches, optimisées (WebP, chargement paresseux), avec une **zone centrale dégagée** pour ne rien gêner. Désactivable en mode calme / contraste renforcé.

### E. Intégration des animations ChatGPT
Je lis les planches de sprites (`NxM`), je les joue en CSS (`steps()`) — léger pour les téléphones modestes — avec **image fixe de secours** si les animations sont réduites ou en mode calme. Tout est mis en cache hors ligne ; je vérifie le poids total (< 8 Mo pour l'ensemble) et je donne un rapport.

---

## 11. Ordre de travail conseillé
1. REF-01 à REF-04 (références) → valider ensemble.
2. Logo (G-01 à G-10, 3 propositions d'abord).
3. Lumi (L-01 à L-16) puis Abdou/Awa (P-01 à P-08).
4. Interface et récompenses (U-01 à U-25).
5. Décors D-01 à D-15, puis éléments détachés et bordures.
6. Nouveaux personnages et images 6-8 ans (P-09 à P-20, N-01 à N-10).

À chaque lot, m'envoyer les fichiers dans un dossier (`assets-v4/…`) : je vérifie le nom, la grille, le poids et la transparence **avant** de les intégrer.

# LUMI V4 — Inspection des assets reçus et intégration du logo A

Branche `v4-assets-integration` (construite sur la V3.5, PR #6 non fusionnée). **Aucune mise en production.**

## 1. Méthode (automatisée, lecture seule)
Archive `LUMI_V4_DOSSIER_COMPLET_POUR_CLAUDE (4).zip` (87 fichiers) extraite dans un dossier neuf, jamais exécutée. Scripts Python (Pillow) : dimensions, mode, canal alpha réel, pixels des quatre coins, marge minimale autour du sujet (seuil 8 %), poids (limites de la section 2 du brief), pourcentage de pixels semi-transparents, couleur moyenne de la frange, îlots de pixels résiduels, régularité de la grille d'un sprite. Résultat complet : `docs/v4/inspection-images.csv` (65 images).
**Ce que l'automatique ne prouve pas** (à regarder à l'œil) : ressemblance entre vues, anatomie, boucle sans saut, lisibilité réelle à 32 px, exactitude culturelle.

## 2. Résultats par lot

| Lot | Verdict | Détail mesuré |
|---|---|---|
| **Logo A** (transparent 1024/2048, WebP, clair/sombre, monochromes) | **Utilisable**, retenu | Alpha réel, coins transparents, marge 15 % ; WebP 1024 = 78 Ko, 2048 = 218 Ko. Les PNG dépassent 300 Ko (403 Ko et 1,4 Mo) : on utilise les WebP dérivés. Source `00_LOGO_A_SOURCE_VALIDE.png` : sujet collé aux bords (marge 0 %), 1,3 Mo, 1 îlot résiduel de 71 px → non utilisée telle quelle. |
| Variantes clair/sombre du logo A | Fonds pleins (pas de transparence voulue) | 349 et 355 Ko (> 300). Pas utilisées dans l'app. |
| Logo A monochromes noir/blanc | OK techniquement | 53 Ko, marge 15 %. PNG seulement (pas de SVG vectoriel natif). |
| **Icône B** (candidate) | **Non validée, non intégrée** | Aperçu 512/192/64/32 : `docs/v4/apercu-icone-B-candidate.png`. Fond bleu plein ; le texte LUMI du médaillon devient illisible à 32 px (le lion reste reconnaissable). 512 px = 302 Ko pour une limite de 60 Ko. |
| REF-01 (2 planches) | **Rejetées** comme assets | Brouillon : fond non transparent (alpha quasi opaque) ; « à retoucher » : 18 îlots résiduels, marge 0 %, 2,8 Mo. |
| REF-02 Lumi (8 expressions) | Références seulement | Alpha réel et propre, mais marge 6,9 % (< 8 %), 706–964 Ko (limite 250 Ko). Pas d'îlot résiduel. |
| REF-03 Abdou/Awa (12 expressions) | Références seulement | Alpha réel ; marge 8,5 % (conforme) ; 541–602 Ko (> 250 Ko). Îlots résiduels : Abdou « surpris » (537 px, mains probablement), Awa « surpris » (107 px), 3 autres de 26–27 px à nettoyer. |
| REF-04 (4 personnages) | Références seulement | Marge 5,9–6,0 % (< 8 %), 463–925 Ko ; grand-père griot : 1 îlot résiduel (9 px, parcelle orange à gauche). |
| **L-01 (sprite prototype)** | **Rejeté** | Planche 1774×887 : cellules de 443,5 px (grille non entière) ; frange rouge semi-transparente (≈ 0,4 % des pixels) autour du sujet ; 8 images quasi identiques (clignement, bouche) et crinière dont le haut varie de 13 px d'une image à l'autre ; 1,5 Mo pour 600 Ko autorisés. Ce n'est pas une animation de repos exploitable. |
| Infographie « prototype non conforme » | Ignorée | L'archive elle-même la déclare non factuelle. |
| L-02 à L-16, P-01 à P-20, U-01 à U-25, D-01 à D-15 (45 couches), N-01 à N-10 | **Absents** | 0 fichier final. Voir section 5. |

Poids : **toutes** les 31 images de référence personnages dépassent la limite de 250 Ko (les 24 portraits individuels pèsent 463 à 964 Ko, soit 1,9× à 3,9× la limite ; les planches jusqu'à 6,2 Mo). Avant intégration : recadrage, marge ≥ 8 %, passage en WebP ou quantification.

## 3. Cohérence des personnages (divergences repérées à l'œil)

| Personnage | Dans l'application actuelle | Dans les références | Verdict |
|---|---|---|---|
| **Lumi** | Illustration d'accueil (maquette V3.4) : bonnet à motifs rouge/jaune/bleu, chemise à motifs, crinière moyenne | **REF-02** : bonnet à motifs, grande crinière, chemise à motifs → cohérent avec l'accueil. **Logo A et L-01** : bandeau triangles rouge/vert/jaune, gilet, short, baskets, queue visible, crinière plus petite → **différent** | **Divergence réelle entre le logo A (validé) et les références REF-02.** À trancher : un seul Lumi canonique. |
| Lumi vectoriel animé (V3.4) | Bandeau rouge à triangles, visage doré | — | Plus proche du logo A que de REF-02. |
| **Abdou** | Accueil : casquette bleue, chemise jaune, sac à dos bleu | REF-03 : casquette bleue brodée, chemise jaune, sac à dos bleu | Cohérent. L'image-guide d'activité (V3.4) a une chemise **bleue** : à remplacer pour rester cohérent. |
| **Awa** | Accueil : tresses à perles, robe jaune/violette | REF-03 : tresses à perles, robe jaune à losanges | Cohérent. |
| Moussa, Fanta, conteuse, griot | Pas encore dans l'app | REF-04 | Nouveaux, non intégrés. |

## 4. Ce qui est intégré dans cette branche
- **Logo A** dans l'écran de bienvenue et l'accueil : `assets/img/logo-lumi-480.webp` (40 Ko) et `logo-lumi-720.webp` (71 Ko), dérivés du PNG 2048 transparent, recadrés sur le sujet. `<h1>` avec image (alt « LUMI », `srcset`, dimensions réservées), **texte « LUMI » de secours** si l'image ne charge pas. Le **slogan « J'apprends en jouant » reste un vrai texte** (traduisible FR/EN), jamais dans l'image.
- Mis en cache hors ligne (`sw.js` version `3-6-0`).
- **Non modifiés** : icône d'application, favicon, manifeste (l'icône B n'est pas validée).
- Captures : `docs/v4/capture-bienvenue-logo-A.jpg`, `docs/v4/capture-accueil-logo-A.jpg`. Sur l'accueil, la pastille d'âge « 4 ans » touche légèrement l'étincelle droite du logo : à régler au prochain passage.

## 5. Production graphique restante (par priorité)
1. **Trancher le Lumi canonique** (logo A / L-01 : bandeau + gilet, ou REF-02 : bonnet + chemise) — bloque tout le reste.
2. **G :** détourer proprement le logo A (la source a des bords irréguliers), version plaque en bois vide (G-01), emblème « tête seule » (G-04), splash 1080×1920 (G-07), logo animé (G-08), icône validée 192/512/maskable, SVG monochrome.
3. **REF-01 à REF-04 :** une planche de référence propre, marges ≥ 8 %, ≤ 250 Ko, îlots supprimés.
4. **L-01 à L-16 :** planches régulières (dimensions entières, ex. 2048×1024 pour 4×2), même cadrage, 8 images réellement différentes, boucle vérifiée. Priorité : idle, salut, parole, bonne réponse, fête, sommeil.
5. **U-01 à U-25 :** étoiles (pop, brille, grise), coche, croix douce, confettis, coffre/calebasse.
6. **D-01 à D-15 :** 45 couches ; d'abord accueil, lettres, nombres, histoires, nature. (En attendant, les décors vectoriels de la V3.5 restent en place.)
7. **N-01 à N-10 et P-01 à P-20** (niveaux 6-8 ans, animaux, guides).
8. Recette : appareils réels, poids total des animations < 8 Mo, mode calme.

Côté code, **rien ne bloque l'arrivée des planches** : le lecteur `js/sprite.js` lit directement une grille `nom-4x2.png` (inutile de convertir en 8×1) et fige la première image en mode calme / animations réduites. Il reste à brancher chaque planche à son état (mascotte, étoiles, décors) quand elle existera.

## 6. Tests
- Page de tests intégrée : **236 / 236** réussis, exécutée dans Chrome (profil propre), service worker et hors ligne compris. Nouveau groupe : logo A (poids < 100 Ko, cache hors ligne, `alt`, `h1`, slogan en texte, texte de secours, slogan anglais).
- Navigateur intégré de l'application : la partie service worker échoue **uniquement** quand une ancienne installation de LUMI contrôle déjà la page (artefact local, constaté plusieurs fois) ; elle passe en navigateur propre.
- Playwright : voir la CI de la PR (non lue à la date de ce rapport ; les runs précédents avaient été annulés).
- **Appareils réels (Android modeste, iPhone, tablette) : non testés.**

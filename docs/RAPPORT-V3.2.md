# LUMI V3.2 — Rapport d'intégration du nouveau design

Branche `v3.2-design` → Pull Request vers `main` (**non fusionnée** : décision du propriétaire).
Production inchangée : https://tan89d.github.io/lumi-app/ sert toujours la V3.1 tant que la PR n'est pas fusionnée.

## 1. Ce qui a été fait

L'application existante n'a pas été réécrite : la V3.2 ajoute une couche de présentation et recâble la navigation.

| Zone | Changement |
|---|---|
| Accueil | En-tête (logo LUMI, « J'apprends en jouant », bouton Parents, profil actif avec avatar et prénom, pastille d'âge), zone personnages, « Bonjour [Prénom] ! / Prêt à apprendre en jouant ? », bouton vert « Commencer » (sélection automatique existante, âge et temps limite respectés). |
| Catalogue | 8 grandes cartes : Lettres et sons, Nombres et calcul, Formes et logique, Couleurs et dessin, Musique et rythmes, Nature et animaux, Pays d'Afrique, Histoires et contes. Chacune ouvre un écran de monde qui lance les vrais jeux existants. |
| Mission du jour | Carte adaptée à l'âge, choisie par un tirage déterministe (profil + date locale + âge) parmi les jeux accessibles ; ouvre un jeu existant ; passe à « faite » quand le jeu est joué le jour même. |
| Progression | Étoiles réelles du profil, barre de progression calculée sur les jeux, accès aux récompenses. Aucune donnée fictive. |
| Navigation | 4 onglets fonctionnels : Accueil, Jeux, Récompenses, Progrès. Le détail des statistiques reste dans l'espace parents. |
| Écrans de jeu | Restylés par CSS (couleurs, boutons, fond), logique inchangée. |
| Images | `hero-941.jpg`/`hero-640.jpg` (srcset), `avatar-boy.jpg`, `avatar-girl.jpg`, `leaves.svg` ; dimensions réservées, `decoding="async"`, `fetchpriority="high"` sur l'image principale. |
| Cache hors ligne | `sw.js` : version `3-2-0`, nouveaux fichiers ajoutés à la liste. |

Fichiers nouveaux : `js/home.js`, `css/design.css`, `assets/img/*`. Fichiers modifiés : `index.html`, `js/main.js`, `js/games.js`, `js/rules.js`, `js/i18n.js`, `sw.js`, tests.
Fichiers inchangés depuis la V3.1 : `env.js`, `store.js`, `audio.js`, `skills.js`, `content.js`, `art.js`, `draw.js`, `minigames.js`, `stories.en.js`, `css/lumi2.css`.

## 2. Garanties de non-régression

- Schéma de données inchangé (version 3) : profils, étoiles, sauvegardes, import/export, statistiques V2/V3.1 restent lisibles.
- Clés de stockage de production inchangées ; toute autre adresse reste isolée et affiche le bandeau « PRÉVISUALISATION ».
- Porte parentale, limites de temps, filtre d'âge, voix, FR/EN, histoires, récompenses, sauvegardes : code non modifié, couvert par les tests existants.
- Aucun service externe, aucune publicité, aucun achat, aucune collecte de données d'enfant. Chemins d'assets relatifs (compatibles GitHub Pages).

## 3. Tests

- Page de tests intégrée (`tests/index.html`) : **175 tests, 175 réussis** en local (navigateur intégré), dont les groupes V3.2 (mission du jour déterministe et adaptée à l'âge, 8 mondes → vrais jeux, navigation 4 onglets, traductions FR/EN, poids des images, absence de ressource externe, liste du cache hors ligne).
- Playwright (Chromium bureau, Pixel 7, iPhone 14 WebKit, iPad WebKit) sur GitHub Actions : voir le résultat de la dernière exécution sur la PR #3 (section 5).
- Les captures d'écran du nouvel accueil sont jointes au rapport Playwright (artefact `rapport-playwright` du workflow).

## 4. Limites connues (honnêteté)

- Aucun test sur appareil réel, ni TalkBack, ni VoiceOver : l'émulation Playwright n'est pas un appareil. Voir `docs/CHECKLIST-APPAREILS.md`.
- Les personnages (Lumi, Abdou, la fillette) viennent de l'illustration fournie, qui n'est pas détourée : ils sont affichés comme une bande illustrée avec fondu en haut, pas comme des éléments indépendants.
- Polices : pile système arrondie, pas de police web (pas de dépendance, hors ligne garanti).
- Les écrans de jeu sont restylés, pas refaits (pas de scène « Lumi en costume » comme sur la maquette du jeu de lettres).
- Seuls les avatars « Abdou » et « Fanta » ont un portrait illustré ; les autres gardent le dessin vectoriel existant.
- La pastille d'étoiles affiche le total (progression ancienne incluse) ; la barre utilise les étoiles des jeux actuels.
- La Récré est accessible par l'onglet Jeux ; l'accès parents est en haut de l'accueil, sur l'accueil et sur la page Progrès (plus d'onglet cadenas).

## 5. Mise en ligne (à décider)

1. Relire la PR #3 et les captures du rapport Playwright.
2. Tester sur un vrai téléphone via un lien de prévisualisation (le bandeau violet protège les données de production).
3. Si validé : fusionner la PR dans `main` ; GitHub Pages publie ; le cache hors ligne se renouvelle (`3-2-0`) sans effacer les données.
4. Retour arrière : annuler la fusion ; les données restent compatibles V3.1.

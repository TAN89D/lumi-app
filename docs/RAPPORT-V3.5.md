# LUMI V3.5 — Niveaux 3 à 8 ans, décors partout, séances variées, Voyage de Lumi

Pull Request vers `main`, **sans fusion automatique**.

## Ce qui est fait
1. **Niveaux de 3 à 8 ans.** Âge d'un profil : 3, 4, 5, 6, 7, 8 (anciens profils intacts ; un âge hors 3-8 revient à 4). Nouveaux paliers de difficulté dans `rules.js`.
2. **Neuf nouveaux jeux 6-8 ans** (même types de manches que l'existant) : Additions, Soustractions, Plus grand/plus petit, Tables de multiplication, Pièces en francs CFA, Lire l'heure (Nombres) ; La lettre qui manque (Lettres) ; Suite de nombres (Logique) ; Les capitales (Pays). Français et anglais, bonne réponse vérifiée mathématiquement par les tests.
3. **Décors africains derrière TOUS les écrans** (`js/decor.js`) : 12 décors vectoriels (accueil, 8 mondes, récré, parents, nuit) avec paysage (baobab, acacia, cases, palmier, étal de marché, djembé, tableau d'école, pagnes, feu de camp, dunes, carte), frise bogolan en haut, soleil/lune, nuages et visiteurs qui passent. Ciel différent par monde. Zone centrale calme ; jamais cliquable ; coupés en mode calme / animations réduites / contraste.
4. **Contre l'ennui** : « Commencer » lance une **séance de 5 activités de familles différentes** (points de progression), et la **difficulté s'adapte doucement** (+1 cran après deux 3 étoiles, −1 après deux 1 étoile, bornée à 3-8).
5. **Le Voyage de Lumi** : carte à 8 étapes (les 8 mondes), mini-séance de 3 jeux différents par étape, **un autocollant** à la fin (une seule fois), sans classement ni verrou. Champ facultatif `stickers` dans le profil (sauvegardé / restauré, filtré à l'import).
6. **Lumi en volume** : la mascotte vectorielle reçoit des dégradés, des reflets et une ombre au sol (effet 3D doux). Les six états et le repli statique sont conservés.
7. **Lecteur de planches d'animation** (`js/sprite.js`) prêt à recevoir les personnages 3D / animations générés plus tard (nom de fichier `nom-4x2.png` = grille ; première image fixe si animations réduites).

## Ce qui n'est PAS fait (honnêteté)
- **Les personnages ne sont pas des modèles 3D rendus.** Je ne peux pas produire de vraies images 3D moi-même (crédits de génération d'images insuffisants sur ce compte). Lumi a un effet de volume dessiné en vecteur ; Abdou, Awa et les autres gardent leurs illustrations actuelles. Les vraies animations 3D viendront des planches générées avec le brief `docs/BRIEF-CHATGPT-ANIMATIONS-V4.md` : le lecteur est prêt.
- Nouveau logo : non fait (à générer, puis intégré).
- Pas de contenu 6-8 ans pour les formes, la musique, les couleurs, ni de contes plus longs ; pas de classement forme + couleur ni d'échos rythmiques.
- Pas d'essai sur appareil réel, ni TalkBack / VoiceOver. Les valeurs de difficulté 6-8 ans (plafonds, nombres) n'ont pas été validées par des enfants de cet âge : à tester.

## Tests (résultats réels)
- Page de tests intégrée (navigateur intégré, local) : **231 / 231** réussis, dont : paliers 3-8, import d'un profil de 8 ans, neuf nouveaux jeux dans les deux langues à tous les âges, exactitude des calculs, difficulté adaptative, 12 décors, décor par monde et par écran, séance de 5 activités, Voyage (8 étapes, autocollant unique, sauvegarde / restauration), lecteur de planches.
- Playwright : voir la CI de la PR ; **non lu à la date de ce rapport**. Les runs de CI des PR précédentes ont été annulés avant la fin.

## Fichiers
Créés : `js/decor.js`, `js/sprite.js`, `docs/RAPPORT-V3.5.md`, `docs/BRIEF-CHATGPT-ANIMATIONS-V4.md`. Modifiés : `js/main.js`, `js/home.js`, `js/games.js`, `js/rules.js`, `js/store.js`, `js/skills.js`, `js/mascot.js`, `js/i18n.js`, `css/design.css`, `index.html`, `sw.js` (version `3-5-0`), `tests/tests.js`, `tests/index.html`.

## Recommandations V3.6
Intégrer les planches 3D (Lumi, Abdou, Awa, animaux) et le nouveau logo ; contenu 6-8 ans pour formes, musique, couleurs ; contes longs avec plusieurs questions ; test avec de vrais enfants de 6 à 8 ans ; mesurer le poids et la fluidité des décors sur Android modeste.

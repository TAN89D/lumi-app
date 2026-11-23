# LUMI V3.1 — Rapport de développement et de tests

Branche `v3.1` (issue de `v3`) · Pull Request vers `v3` · `main` et le site de production **non modifiés**.

## 0. Résumé honnête

| | |
|---|---|
| Tests intégrés (page `tests/index.html`) | **141 / 141 réussis** en local (Chromium) |
| GitHub Actions + Playwright | **Réussi** (exécution n° 4) : **26 réussis, 2 ignorés volontairement**, sur Chromium, Android Pixel 7 (émulation), iPhone 14 et iPad (WebKit, émulation) |
| Tests sur vrais Android / iPhone / tablette, TalkBack, VoiceOver | **NON RÉALISÉS** (aucun appareil). Une checklist est fournie : `docs/CHECKLIST-APPAREILS.md` |
| Prévisualisation sur une origine différente de la production | **Non fournie telle quelle** : GitHub Pages partage une seule origine pour tous les dépôts du compte. Isolation par chemin implémentée et testée (voir §1, point 9) |
| Déploiement | Rien n'est déployé. Rien n'est fusionné dans `main` |

Quatre exécutions GitHub Actions ont été nécessaires ; les trois premières ont **échoué**, avec des causes distinctes (voir §3). Aucun échec n'a été masqué.

## 1. Modifications, causes et corrections

### Sprint 1 — Fiabilité et données

**1. `Sound.clearClips()` — `js/audio.js`**
- *Cause (V3)* : la fonction renvoyait `true` après `onsuccess`, `onerror` ou `onblocked` sans les distinguer ; si l'effacement était bloqué par un autre onglet, il pouvait être annoncé comme réussi et la mémoire vidée alors que les enregistrements existaient toujours.
- *Correction* : résultat structuré `{ ok, state: 'success' | 'blocked' | 'error' | 'unavailable', remaining, why }`. `blocked` n'est **jamais** un succès (délai configurable, 3 s par défaut). Après `onsuccess`, la base est rouverte et ses enregistrements **comptés** : succès seulement si 0 reste. La mémoire n'est vidée qu'à ce moment-là ; si la suppression aboutit plus tard (autre onglet fermé), la mémoire est alors mise à jour. `onversionchange` ferme la base quand un autre onglet demande l'effacement. `saveClip()` renvoie maintenant une promesse « écriture confirmée ou non ».
- *Tests* : succès vérifié (base vide + mémoire vide), base bloquée (état `blocked`, enregistrements toujours là, puis succès après fermeture), autre onglet coopératif, IndexedDB indisponible (`unavailable`), nouvel essai après blocage.

**2. `Store.wipeAll()` — `js/store.js`**
- *Cause* : suppression sans contrôle ; aucune information sur ce qui avait échoué ; la mémoire était vidée même si le stockage résistait.
- *Correction* : chaque opération est **relue** (`getItem`) ; résultat `{ ok, partial, steps, failed }` ; la mémoire n'est vidée que si le stockage l'est vraiment ; l'écran affiche « Tout a été effacé » **uniquement** si `ok`, sinon « Effacement INCOMPLET » avec la liste des étapes et un bouton **Recommencer** (relancer ne fait que terminer ce qui reste). Un effaceur qui plante ou qui est bloqué compte comme un échec.
- *Tests* : tout effacé ; une clé qui résiste → partiel signalé, mémoire conservée ; effaceur bloqué puis nouvel essai réussi ; effaceur qui lève une exception ; clés d'autres applications et d'autres versions non touchées. Vérifié aussi dans l'interface (boîte de dialogue partielle, puis « Tout a été effacé » après le second essai).

**3. `Store.importData()` — `js/store.js`**
- *Cause* : l'état actuel était modifié avant de savoir si l'écriture réussirait.
- *Correction* : les nouvelles données sont **préparées à part** (`next`) ; une **écriture d'essai** de la taille exacte est faite sous une clé temporaire ; l'écriture finale est **relue** ; en cas d'échec, l'ancienne valeur est remise et l'état en mémoire n'est jamais touché ; message « données actuelles conservées ». Les compétences (historique) ne sont plus remises à zéro à la fusion : l'historique le plus riche est gardé. Une sauvegarde V1 (`limitMin`) est convertie.
- *Tests* : sauvegardes **V1** et **V2** importées (fusion), mode « remplacer », stockage plein dès le départ, échec uniquement à l'écriture finale, fichier invalide, aucune clé temporaire résiduelle.

**4. Service worker — `sw.js`**
- *Cause* : sur GitHub Pages, tous les dépôts d'un compte partagent origine **et caches** ; l'ancien code supprimait tout cache dont le nom ne correspondait pas au sien.
- *Correction* : version `3-1-0` ; nom du cache = `lumi-app::<adresse>::<version>` ; suppression **uniquement** des caches LUMI (même préfixe, autre version) et des anciens noms `lumi-v…` ; requêtes hors du périmètre de LUMI ignorées ; installation avec `cache: 'reload'` (jamais de copie HTTP périmée) et « tout ou rien » ; liste de fichiers complète (20).
- *Tests* : tous les fichiers listés existent (HTTP 200) ; tout script de `index.html` est dans la liste ; le cache d'une autre application n'est **pas** supprimé ; l'ancien cache LUMI l'est ; un seul cache courant ; tous les fichiers présents dans le cache ; **Playwright : visite, puis passage hors ligne, rechargement et partie jouée** (Chromium et Android en émulation).

### Sprint 2 — Pédagogie et multilinguisme

**5. Choix automatique — `js/rules.js`, `js/main.js`**
- *Cause* : après avoir terminé tous les jeux adaptés, `auto()` tirait un jeu au hasard parmi **tous** les jeux, y compris ceux de 4 et 5 ans.
- *Correction* : fonction testable `Rules.nextGame()` ; le filtre d'âge reste actif dans tous les cas (jamais joué → pas à 3 étoiles → au hasard **parmi les jeux adaptés**) ; repli sur les plus faciles si rien ne convient.
- *Tests* : 3 âges × 3 situations (rien commencé, tout à 3 étoiles, mélange) sur 60 tirages ; cas de régression « à 3 ans, tout terminé » ; variété du choix.

**6. Anglais complet**
- Les 10 histoires traduites (`js/stories.en.js`) : même nombre de pages, mêmes images, titres et origines traduits, voix en-US ; instructions d'installation, noms de missions, véhicules et pilotes, messages d'effacement, de voix et d'enregistrement traduits ; textes restés en français corrigés. Un texte français lu pendant une interface anglaise garde la voix française.
- **Aucune voix compatible** : message explicite, une fois par langue et par session (« Aucune voix {langue} n'est installée… »), au lieu d'un silence inexpliqué.
- *Limites* : les traductions des histoires sont les miennes, **non relues par un anglophone**. Les voix sont testées avec une synthèse simulée (la machine de test n'a aucune voix) ; aucune vraie voix anglaise n'a été écoutée.

**7. Compétences — `js/skills.js`**
- **Réussite** = partie à 2 étoiles ou plus ; **répétition** = nombre de parties et de jours différents ; **maîtrise** = 3 parties, 2 jours, résultats récents solides. **1 étoile vaut 50 %** (au lieu de 33 %) ; **une seule mauvaise partie ne fait pas perdre la maîtrise** ; des difficultés répétées ramènent à « en cours », jamais à « à découvrir ».
- Historique conservé : migration **2 → 3** additive (ajout de l'historique, rien n'est supprimé) ; ancien format évalué par l'ancienne règle.
- **Conseils aux parents** (jamais plus de 4) : « à découvrir », « rejouer sans insister », « prêt pour la suite », avec le jeu précis conseillé, toujours adapté à l'âge. Aide sous les compétences : « Une erreur ne fait jamais perdre ce qui est acquis ».

**8. Tests de régression** : 141 tests (voir §2) : IndexedDB bloqué / indisponible, échec d'écriture localStorage, restauration et fusion, filtres d'âge, parité français/anglais, hors ligne.

### Sprint 3 — Validation et livraison

**9. Prévisualisation** — `js/env.js`
- *Constat* : un site de prévisualisation sur GitHub Pages partage la même origine (`tan89d.github.io`) que la production ; `localStorage`, IndexedDB et caches seraient partagés.
- *Mesure prise* : les clés, la base de voix et les caches sont **séparés par chemin**. La production (`tan89d.github.io/lumi-app/`) garde ses clés historiques (`lumi.v1`, `lumi-voice`) ; toute autre adresse utilise un préfixe propre et affiche un **bandeau violet « PRÉVISUALISATION »**. Un effacement n'atteint jamais les clés de l'autre environnement (testé).
- *Ce qui n'est PAS fait* : une prévisualisation sur une **origine** réellement différente. Options : (a) un domaine personnalisé ; (b) un hébergeur distinct (Netlify, Cloudflare Pages) ; (c) `localhost`. Aucune n'a été mise en place sans votre accord.

**10. Playwright et GitHub Actions** — `package.json`, `playwright.config.js`, `tests/e2e/lumi.spec.js`, `.github/workflows/tests.yml`
- Lancement à chaque `push` sur `v3` et `v3.1` et chaque Pull Request. 4 projets : Chromium bureau, Pixel 7, iPhone 14 (WebKit), iPad (WebKit) ; la page de 141 tests y est exécutée à chaque fois, plus 5 parcours et le hors ligne (Chromium/Android).

**11. Appareils réels, TalkBack, VoiceOver** : **non réalisés**. `docs/CHECKLIST-APPAREILS.md` détaille ce qu'il reste à vérifier.

## 2. Résultats des tests

| Où | Résultat |
|---|---|
| Navigateur intégré (Chromium), `tests/index.html` | 141 / 141 |
| GitHub Actions, exécution n° 4 | 26 réussis, 2 ignorés (le test « hors ligne » est volontairement limité à Chromium) |
| Détail des 26 | par projet : 141 tests intégrés, accueil sans débordement, un jeu complet jusqu'aux étoiles, porte parentale, zoom non bloqué, passage en anglais ; hors ligne sur Chromium et Pixel 7 |

## 3. Anomalies rencontrées pendant ce travail (causes)

1. **CI n° 1 — échec** : `ubuntu-latest` est devenu **Ubuntu 26.04**, que Playwright 1.48 ne sait pas installer (`libicu74`, `libxml2`, `libvpx9`… introuvables). Correction : `runs-on: ubuntu-24.04`.
2. **CI n° 3 — échec sur iPhone et iPad (WebKit) uniquement** : l'assertion « `saveClip` confirme l'écriture dans IndexedDB ». *Hypothèse étayée par une sonde ajoutée au test* : ce moteur de test ne conserve pas les Blob dans IndexedDB. Ce n'est pas un défaut de l'application, qui annonce justement l'échec (`saveClip` renvoie faux, le clip reste utilisable en mémoire, message à l'écran). Le test vérifie maintenant ce contrat dans les deux cas. *À confirmer sur un vrai iPhone* : si Safari y refuse aussi de stocker un Blob, il faudra stocker l'audio autrement (ArrayBuffer).
3. **Échec local intermittent du test du service worker** : une installation précédente du service worker (dans le même navigateur) empêchait l'activation attendue. Le test repart maintenant d'un état propre.
4. **Mon propre bug évité en passant** : un remplacement de texte par script a laissé un « XX » dans `skills.js` ; détecté à la relecture et corrigé avant tout test.

## 4. Risques encore présents

1. **Appareils réels non testés** (voix, son iOS, installation, zone sûre, micro, TalkBack, VoiceOver, doigts d'enfants).
2. **Retour en arrière** : une fois les données au schéma 3, la branche `v3` (schéma 2) les refuse (elle les considère comme illisibles, en garde une copie `lumi.v1.corrupt` et repart à zéro). Le site actuellement en ligne (V2 sur `main`) n'a pas de contrôle de version : il relirait ces données en ignorant les nouveaux champs, **mais je ne l'ai pas testé**. Des copies `lumi.v1.pre-v1` / `pre-v2` sont créées avant migration ; **exportez les données avant le déploiement**.
3. **Prévisualisation** : pas d'origine distincte (voir §1.9).
4. **Traductions** anglaises non relues ; voix anglaises non écoutées.
5. **Enregistrements vocaux** : Blob dans IndexedDB (voir §3.2) ; ils ne sont pas inclus dans l'export.
6. **Seuils pédagogiques** (âges, compétences) : choix raisonnés, jamais validés avec des enfants.
7. **CI** : `npm install` sans fichier de verrouillage (versions de dépendances non figées, hors Playwright épinglé) ; avertissement GitHub sur Node 20 (actions forcées sur Node 24) ; pas de `.gitignore` (aucun `node_modules` n'a été créé ici).
8. La Récré (moto, course) et les scènes des histoires utilisent encore des emojis.

## 5. Étapes de déploiement proposées

1. Relire la Pull Request `v3.1 → v3` ; vérifier que l'action « Tests LUMI » est verte.
2. Fusionner dans `v3` (pas dans `main`).
3. Faire passer `docs/CHECKLIST-APPAREILS.md` sur au moins un Android, un iPhone et une tablette, avec une prévisualisation (domaine ou hébergeur distinct, ou `localhost`).
4. **Exporter les données** de l'appareil de l'enfant (Espace parent → Exporter).
5. Fusionner `v3` dans `main` ; attendre la publication de GitHub Pages ; ouvrir le site, vérifier la version (`lumi-app::…::3-1-0` dans les caches) et que la progression existante est intacte.
6. Retour arrière si besoin : annuler la fusion dans `main` et réimporter l'export.

## 6. Pour la suite (V3.2)

Tests sur appareils réels ; stockage audio en ArrayBuffer si nécessaire ; prévisualisation sur une origine distincte ; relecture des traductions ; verrouillage des dépendances ; export des enregistrements vocaux ; dessins vectoriels pour la Récré et les histoires.

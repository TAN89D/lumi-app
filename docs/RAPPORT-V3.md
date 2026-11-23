# LUMI V3 — Rapport d'audit et de correction

**État : version candidate, NON déployée, NON poussée sur GitHub.** Le travail est dans le dossier `v3/` (copie de travail de la V2 ; Git n'est pas installé sur ce PC, donc la « branche » est ce dossier). La V2 en ligne n'a pas été modifiée.

**Résultat des tests : 92 / 92 réussis** (`v3/tests/index.html`, exécutés dans le navigateur intégré le 2026-11-23), plus des vérifications manuelles d'interface listées en section 3.

## 1. Anomalies corrigées

| # | Problème | Fichier | Cause (lue dans le code V2) | Correction | Test |
|---|---|---|---|---|---|
| 1 | Effacement global incomplet | `js/store.js`, `js/audio.js`, `js/main.js` | `resetAll()` ne vidait que la mémoire de `lumi.v1` ; la base IndexedDB `lumi-voice`, les copies et la préférence d'installation restaient | `Store.wipeAll()` supprime toutes les clés `lumi.*` (parcours par `key(i)`), puis appelle les « effaceurs » enregistrés ; `Sound.clearClips()` supprime les clips ET la base. **Bug supplémentaire trouvé par les tests :** un effacement lancé pendant qu'un autre onglet garde la base ouverte restait bloqué ; ajout de `onversionchange` pour que l'autre onglet se déconnecte | « Effacement global » 5/5 ; test manuel : 3 clés `lumi.*` → 0, base des voix vide |
| 2 | Gestion du volume | `js/audio.js`, `js/main.js` | Le curseur démarrait à 0,1 (impossible de couper) ; valeur jamais validée (import, données corrompues → NaN) ; volume des clips enregistrés non mis à jour en direct ; **à volume 0 le gain des effets valait 0 et `exponentialRampToValueAtTime(0)` lève une erreur Web Audio**, donc les effets pouvaient s'arrêter | `Sound.vol()` borne toujours entre 0 et 1 (valeur sûre 0,9 si corrompue) ; curseur de 0 à 1 ; `setVolume` applique tout de suite au clip en cours ; plancher de gain 0,0002. *Limite : je n'ai pas reproduit l'erreur Web Audio sur la V2, c'est une analyse du code.* | « Voix » : 0,3 appliqué ; 0 = silence ; 7 → 1 ; −3 → 0 ; « abc » → 0,9 |
| 3 | Limite de session ambiguë | `js/rules.js`, `js/main.js` | Un seul réglage « limite » ne faisait qu'un rappel, sans restriction réelle | Deux réglages : **rappel de pause** (doux, l'enfant peut continuer) et **limite de la journée** (écran verrouillé ; seul un adulte, après la porte parentale, accorde +10 min) ; compteur sur le jour **local** | « Limites de temps » 5/5 ; manuel : 20 min jouées + limite 20 → écran verrouillé, jeu refusé, déverrouillage par adulte → accueil |
| 4 | Paramètres sensibles trop peu protégés | `js/rules.js`, `js/main.js` | Un enfant pouvait maintenir un bouton 2 s ; effacement via `window.confirm` | Porte en 2 étapes (maintien 2 s **puis** addition d'adulte au clavier numérique) ; 3 erreurs = blocage 30 s ; espace parent refermé après 2 min sans toucher ; suppression de profil, effacement et suppression des voix passent par une confirmation intégrée | « Porte parentale » 4/4 ; manuel : maintien → calcul → 3 erreurs → blocage |
| 5 | Dates en UTC | `js/store.js` | `new Date().toISOString().slice(0,10)` : le jour change à l'heure de Greenwich, pas à minuit chez l'enfant | `Store.localDay()` (année/mois/jour locaux) utilisé partout (temps de jeu, mises à jour, récompenses, prolongation) | « Dates » 4/4 (23h30 → 5 janvier, 00h10 → 6) |
| 6 | Pas d'import | `js/store.js`, `js/main.js` | Export seul | Import avec validation stricte (taille ≤ 2 Mo, JSON, forme, version, liste blanche, bornes, clés `__proto__` ignorées, texte jamais exécuté), choix **fusionner** (garde les meilleures étoiles, ne perd rien) ou **remplacer**, copie `lumi.v1.backup` avant tout | « Import » 12/12 + « fusion » 8/8 + manuel via le vrai champ fichier |
| 7 | Échecs de stockage silencieux | `js/store.js`, `js/main.js` | `save()` avalait les erreurs ; JSON illisible → page cassée | `save()` renvoie vrai/faux et publie un état ; bandeau visible si stockage plein/bloqué ; données illisibles copiées dans `lumi.v1.corrupt` puis redémarrage propre ; fichier d'import invalide : message précis, aucune modification | « Stockage » 5/5 ; manuel : `setItem` forcé en erreur → bandeau |

## 2. Fonctions améliorées

- **Profils (8)** : création (prénom, avatar, âge 3/4/5), choix par l'enfant en touchant son avatar, suppression avec confirmation, 8 maximum, au moins un profil toujours présent. Testé en interface.
- **Compétences (12)** — `js/skills.js` : 19 compétences, séparées des étoiles et trophées ; moyenne glissante qui peut monter **et** descendre ; 3 niveaux (À découvrir / En cours / Acquis) ; reconstruites depuis la progression existante. Tests 5/5.
- **Âge (13)** — `js/rules.js` : le profil a un âge ; comptage jusqu'à 3 / 5 / 7, additions, paires de mémoire, mélodies et nombre de tracés s'adaptent ; chaque jeu a un niveau conseillé (badge « 4+ », « 5+ ») ; « Jouer » ne propose que des jeux adaptés. Tests 7/7.
- **Accessibilité (10, 11)** : zoom du navigateur de nouveau autorisé (le `user-scalable=no` est retiré) ; taille de texte 100/125/150 % ; grands boutons ; contraste ; animations réduites (et respect de `prefers-reduced-motion`) ; focus visible ; clavier pour la porte et le glisser-déposer ; libellés `aria` ; consigne répétée avec pulsation après 12 s d'inactivité ; consigne vocale à l'entrée d'une catégorie.
- **Appareils (9)** : colonne et grille adaptées aux tablettes (3 colonnes dès 700 px), paysage, `dvh`. Contrôle de débordement horizontal sur 14 écrans à 360×740, sur 11 écrans à 768×1024, sur 6 écrans à 1024×640 et sur 3 écrans à 390×844 : aucun débordement horizontal (en paysage bas, la mémoire dépasse la hauteur de 20 px : l'écran défile).
- **Architecture (14–17)** : `i18n.js` (textes FR/EN, clés), `rules.js` (règles sans interface), `skills.js`, `store.js` versionné (schéma 2, table de migrations, copie avant migration). Les phrases prononcées ont un **identifiant stable** (`fr:ask.count`, `fr:ask.letter.listen|l=A`) qui ne dépend pas du texte : reformuler ne perd plus les enregistrements ; les anciens enregistrements par texte restent lisibles.

## 3. Tests

**Automatisés (92/92)** : migration 7, stockage 5, dates 4, import 12, fusion 8, export 1, effacement 5, porte 4, limites 5, âge 3, compétences 5, localisation 6, cohérence des manches (3 âges × 2 langues × 40 jeux et histoires × 2 niveaux de choix) 6, adaptation à l'âge 4, voix/volume 11, écrans 6.
Lancer : ouvrir `v3/tests/index.html` via un serveur local (`python -m http.server`) ; le test IndexedDB s'exécute seulement sur localhost, pour ne jamais effacer de vrais enregistrements.

**Manuels dans le navigateur intégré** : porte (maintien, calcul, blocage), création/changement d'âge/suppression de profil, réglages (pause, limite, volume, taille du texte, langue FR↔EN), verrouillage et déverrouillage, import (fichier invalide, fusion, remplacement), bandeau d'erreur de stockage, effacement total, les 40 écrans de jeu et d'histoire ouverts (30 jeux + 10 histoires ; la mention « 38 jeux » donnée plus tôt dans la conversation était une erreur de comptage), débordements d'écran.

**Échoués puis corrigés pendant l'audit** : clés anglaises `countryof` manquantes (parité FR/EN) ; effacement bloqué par un autre onglet ; effacement non conforme avec un stockage factice. Aucun échec restant.

## 4. Risques résiduels (honnêtes)

1. **Aucun test sur un vrai Android ou iPhone.** « Android/iOS » = émulation de tailles d'écran. Non vérifiés : voix de synthèse réelle, déblocage du son sur iOS, installation, zone sûre (encoche), micro pour l'enregistrement.
2. **Aucun test avec de vrais enfants.** Les seuils d'âge et de compétences sont des choix raisonnés, pas validés pédagogiquement. Le tracé des lettres reste difficile avant 4 ans.
3. **Anglais partiel** : interface, consignes, vocabulaire et espace parent traduits ; mais les **histoires restent en français**, les instructions d'installation du navigateur aussi, et la Récré utilise encore des emojis.
4. **Accessibilité** : libellés ajoutés mais jamais testés avec TalkBack / VoiceOver ; contraste renforcé non mesuré.
5. **Fermeture automatique de l'espace parent après 2 min** et **blocage de la porte 30 s** : codés mais non testés automatiquement (attente trop longue).
6. **Migrations** : seule v1→v2 est testée ; il n'existe encore aucun test v2→v3.
7. **Enregistrements vocaux** liés à une langue (`fr:` / `en:`) ; ils ne sont pas inclus dans l'export (stockés dans IndexedDB).
8. **Mélange sur un même navigateur** : la page de test partage le stockage de `localhost` avec l'app.

## 5. Propositions pour V3.1

1. Tests sur 2 Android, 1 iPhone, 1 tablette, avec TalkBack et VoiceOver.
2. Session d'observation avec 5 à 10 enfants par tranche d'âge ; ajuster `Rules.CAPS`.
3. Traduire les histoires et les instructions d'installation ; ajouter une 3e langue (bambara) en ne touchant qu'à `i18n.js`.
4. Remplacer les emojis de la Récré et des histoires par des dessins vectoriels.
5. Export des enregistrements vocaux (fichier zip) et import.
6. Intégration continue : exécuter `tests/index.html` dans un navigateur sans interface à chaque modification (nécessite Node ou Playwright, absents ici).
7. Migration v2→v3 de test et schéma de données documenté.
8. Mettre en production par étapes : branche GitHub → Pages de prévisualisation → validation → `main`.

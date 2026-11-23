// Configuration et contenu de LUMI. Tout ce qui est modifiable (nom, personnage,
// couleurs, langues, textes, contenus pédagogiques) se trouve ICI.
window.LUMI = {
  config: {
    appName: 'LUMI',
    tagline: "J'apprends en jouant",
    guideName: 'Abdou Alima Emunas',   // personnage-guide principal
    guideShort: 'Abdou',
    mascotName: 'Lumi',                // petite mascotte (lion) : indices et fêtes
    colors: {                          // appliquées en variables CSS au démarrage (style « Duolingo »)
      turq: '#4fa3a5', turqD: '#3b8587',     // turquoise doux
      sun: '#f2b632', sunD: '#d3921a',       // jaune moutarde
      coral: '#e8694a', coralD: '#c9502f',   // corail
      violet: '#a98bd3', violetD: '#8567b3', // violet doux
      leaf: '#7a9a2e', leafD: '#5c7a1f',     // vert olive principal
      cream: '#fffaf0', ink: '#4a3f2a', bg: '#fbf3dc'
    },
    languages: [
      { code: 'fr', label: 'Français', ready: true },
      { code: 'bm', label: 'Bambara (en préparation)', ready: false }
    ],
    speechLang: { fr: 'fr-FR' },
    parentHoldMs: 2000
  },

  // Textes séparés du code : ajouter une langue = ajouter un objet ici.
  strings: {
    fr: {
      hello: 'Bonjour, {name} !',
      helloGuest: 'Bonjour !',
      continue: 'Continuer',
      letters: 'Lettres', numbers: 'Nombres', shapes: 'Formes', stories: 'Histoires', memory: 'Mémoire',
      askMemory: 'Retrouve les deux images identiques.',
      hintMemory: 'Regarde : ces deux images brillent !',
      path: 'Mon parcours d’apprentissage', rewards: 'Mes récompenses',
      play: 'Jouer', replay: 'Rejouer', home: 'Accueil',
      askLetter: 'Écoute et choisis l’image qui commence par la lettre.',
      askCount: 'Compte les mangues et choisis le bon nombre.',
      askShape: 'Glisse chaque forme à la bonne place.',
      tryAgain: ['Presque ! Essaie encore.', 'Tu y es presque !', 'Regarde bien, tu peux le faire !'],
      hintLetter: 'Écoute encore : l’image brille pour t’aider.',
      hintCount: 'Comptons ensemble, un par un !',
      hintShape: 'Regarde le contour : la bonne place brille.',
      praise: ['Bravo !', 'Super !', 'Tu as bien observé !', 'Quel bel effort !', 'Bien joué !'],
      done: 'C’est réussi !',
      quit: 'Tu veux sortir ?',
      locked: 'Pas encore ! D’abord, joue l’étape d’avant.',
      offline: 'Hors ligne'
    }
  },

  letters: [
    { l: 'A', word: 'arbre', img: '🌳' }, { l: 'B', word: 'banane', img: '🍌' },
    { l: 'C', word: 'coco', img: '🥥' },   { l: 'E', word: 'éléphant', img: '🐘' },
    { l: 'L', word: 'lion', img: '🦁' },   { l: 'M', word: 'mangue', img: '🥭' },
    { l: 'P', word: 'pomme', img: '🍎' },  { l: 'S', word: 'soleil', img: '☀️' },
    { l: 'T', word: 'tortue', img: '🐢' }
  ],
  numberWords: ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'],
  countEmojis: ['🥭'],   // on ne compte que des mangues, comme la consigne le dit
  memoryEmojis: ['🥭', '🦁', '🐘', '🌺', '🥁', '🐢'],
  shapes: {
    circle:    { name: 'Cercle' },
    square:    { name: 'Carré' },
    triangle:  { name: 'Triangle' },
    rectangle: { name: 'Rectangle' }
  },

  // Catégories de l'accueil (couleur = jeton de config.colors).
  domains: {
    letters:   { label: 'Lettres',  ico: '🔤', c: 'turq' },
    numbers:   { label: 'Nombres',  ico: '🔢', c: 'sun' },
    colors:    { label: 'Couleurs', ico: '🎨', c: 'coral' },
    shapes:    { label: 'Formes',   ico: '🔺', c: 'violet' },
    logic:     { label: 'Logique',  ico: '🧩', c: 'leaf' },
    art:       { label: 'Art',      ico: '🖍️', c: 'turq' },
    music:     { label: 'Musique',  ico: '🎵', c: 'violet' },
    trace:     { label: 'Fiches',   ico: '✏️', c: 'sun' },
    countries: { label: 'Pays',     ico: '🌍', c: 'coral' },
    nature:    { label: 'Nature',   ico: '🦁', c: 'leaf' },
    memory:    { label: 'Mémoire',  ico: '🃏', c: 'turq' }
  },

  // Vocabulaire illustré (couleurs, animaux, pays d'Afrique). Les couleurs ont aussi un MOTIF : jamais la couleur seule.
  vocab: {
    colors: {
      rouge: { name: 'rouge', hex: '#e8453c', pat: 'dots' },   bleu:   { name: 'bleu',   hex: '#2f7de1', pat: 'stripes' },
      jaune: { name: 'jaune', hex: '#f2c200', pat: 'waves' },   vert:   { name: 'vert',   hex: '#3fae49', pat: 'checks' },
      orange: { name: 'orange', hex: '#f28c1b', pat: 'cross' }, violet: { name: 'violet', hex: '#8a55c9', pat: 'diag' },
      rose:  { name: 'rose',  hex: '#f47fb0', pat: 'dots' },    marron: { name: 'marron', hex: '#8b5a2b', pat: 'stripes' }
    },
    nature: {
      lion: { name: 'lion', say: 'le lion', e: '🦁' }, elephant: { name: 'éléphant', say: 'l’éléphant', e: '🐘' }, girafe: { name: 'girafe', say: 'la girafe', e: '🦒' },
      zebre: { name: 'zèbre', say: 'le zèbre', e: '🦓' }, singe: { name: 'singe', say: 'le singe', e: '🐒' }, crocodile: { name: 'crocodile', say: 'le crocodile', e: '🐊' },
      hippo: { name: 'hippopotame', say: 'l’hippopotame', e: '🦛' }, tortue: { name: 'tortue', say: 'la tortue', e: '🐢' }, perroquet: { name: 'perroquet', say: 'le perroquet', e: '🦜' },
      flamant: { name: 'flamant rose', say: 'le flamant rose', e: '🦩' }, poisson: { name: 'poisson', say: 'le poisson', e: '🐟' }, serpent: { name: 'serpent', say: 'le serpent', e: '🐍' }
    },
    // flag : orientation des bandes (v = verticales, h = horizontales) + couleurs + emblème éventuel
    countries: {
      mali:    { name: 'Mali', of: 'du Mali', flag: { o: 'v', c: ['#14b53a', '#fcd116', '#ce1126'] } },
      senegal: { name: 'Sénégal', of: 'du Sénégal', flag: { o: 'v', c: ['#00853f', '#fdef42', '#e31b23'], star: '#00853f' } },
      civ:     { name: 'Côte d’Ivoire', of: 'de la Côte d’Ivoire', flag: { o: 'v', c: ['#f77f00', '#ffffff', '#009e60'] } },
      burkina: { name: 'Burkina Faso', of: 'du Burkina Faso', flag: { o: 'h', c: ['#ef2b2d', '#009e49'], star: '#fcd116' } },
      guinee:  { name: 'Guinée', of: 'de la Guinée', flag: { o: 'v', c: ['#ce1126', '#fcd116', '#009460'] } },
      ghana:   { name: 'Ghana', of: 'du Ghana', flag: { o: 'h', c: ['#ce1126', '#fcd116', '#006b3f'], star: '#000000' } },
      nigeria: { name: 'Nigéria', of: 'du Nigéria', flag: { o: 'v', c: ['#008751', '#ffffff', '#008751'] } },
      cameroun: { name: 'Cameroun', of: 'du Cameroun', flag: { o: 'v', c: ['#007a5e', '#ce1126', '#fcd116'], star: '#fcd116' } },
      niger:   { name: 'Niger', of: 'du Niger', flag: { o: 'h', c: ['#e05206', '#ffffff', '#0db02b'], dot: '#e05206' } },
      benin:   { name: 'Bénin', of: 'du Bénin', flag: { o: 'benin', c: ['#008751', '#fcd116', '#e8112d'] } }
    }
  },

  // Logique : emojis utilisés pour les suites et les intrus.
  logicSets: {
    shapes: ['🔴', '🔵', '🟡', '🟢', '🟣', '🟠'],
    fruits: ['🥭', '🍌', '🥥', '🍎', '🍍'],
    animals: ['🦁', '🐘', '🐒', '🦒', '🐢'],
    vehicles: ['🏍️', '🚗', '🚌', '🚜', '🚲']
  },
  // Fiches : glyphes à tracer au doigt.
  traceKeys: { 'TR-1': ['1', '2', '3'], 'TR-2': ['A', 'B', 'C'], 'TR-3': ['4', '5', 'M'] },
  // Coloriages : modèles SVG dessinés dans art.js.
  templates: { soleil: 'Le soleil', case: 'La case', poisson: 'Le poisson', baobab: 'Le baobab' },
  // Xylophone : 8 lames (fréquences en Hz), repères de couleur + lettre de note.
  notes: [
    { n: 'Do', f: 261.63, c: '#e8453c' }, { n: 'Ré', f: 293.66, c: '#f28c1b' }, { n: 'Mi', f: 329.63, c: '#f2c200' }, { n: 'Fa', f: 349.23, c: '#3fae49' },
    { n: 'Sol', f: 392.0, c: '#2f7de1' }, { n: 'La', f: 440.0, c: '#8a55c9' }, { n: 'Si', f: 493.88, c: '#f47fb0' }, { n: 'Do', f: 523.25, c: '#e8453c' }
  ],

  // Parcours : l'ordre conseillé des étapes. Une étape s'ouvre quand la précédente de SA catégorie est réussie.
  steps: [
    { id: 'L-A', domain: 'letters', key: 'A' },
    { id: 'L-B', domain: 'letters', key: 'B' },
    { id: 'C-1', domain: 'colors', key: ['rouge', 'bleu', 'jaune'] },
    { id: 'L-C', domain: 'letters', key: 'C' },
    { id: 'N-1', domain: 'numbers', key: 1 },
    { id: 'N-2', domain: 'numbers', key: 2 },
    { id: 'NA-1', domain: 'nature', key: ['lion', 'elephant', 'girafe'] },
    { id: 'N-3', domain: 'numbers', key: 3 },
    { id: 'S-1', domain: 'shapes', key: ['circle', 'square', 'triangle'] },
    { id: 'TR-1', domain: 'trace', key: 'TR-1' },
    { id: 'L-M', domain: 'letters', key: 'M' },
    { id: 'C-2', domain: 'colors', key: ['vert', 'orange', 'violet'] },
    { id: 'L-L', domain: 'letters', key: 'L' },
    { id: 'N-4', domain: 'numbers', key: 4 },
    { id: 'P-1', domain: 'countries', key: ['mali', 'senegal', 'civ'] },
    { id: 'N-5', domain: 'numbers', key: 5 },
    { id: 'S-2', domain: 'shapes', key: ['circle', 'square', 'triangle', 'rectangle'] },
    { id: 'LO-1', domain: 'logic', key: 'suite2' },
    { id: 'M-1', domain: 'memory', key: 2 },   // nombre de paires
    { id: 'NA-2', domain: 'nature', key: ['zebre', 'singe', 'crocodile'] },
    { id: 'M-2', domain: 'memory', key: 3 },
    { id: 'L-E', domain: 'letters', key: 'E' },
    { id: 'TR-2', domain: 'trace', key: 'TR-2' },
    { id: 'L-P', domain: 'letters', key: 'P' },
    { id: 'N-6', domain: 'numbers', key: 6 },
    { id: 'C-3', domain: 'colors', key: ['rose', 'marron', 'rouge', 'vert'] },
    { id: 'N-7', domain: 'numbers', key: 7 },
    { id: 'S-3', domain: 'shapes', key: ['square', 'rectangle', 'triangle'] },
    { id: 'MU-1', domain: 'music', key: 3 },   // longueur de la mélodie
    { id: 'L-S', domain: 'letters', key: 'S' },
    { id: 'L-T', domain: 'letters', key: 'T' },
    { id: 'NA-3', domain: 'nature', key: ['hippo', 'tortue', 'perroquet'] },
    { id: 'N-8', domain: 'numbers', key: 8 },
    { id: 'P-2', domain: 'countries', key: ['burkina', 'guinee', 'ghana'] },
    { id: 'N-9', domain: 'numbers', key: 9 },
    { id: 'AR-1', domain: 'art', key: 'soleil' },
    { id: 'N-10', domain: 'numbers', key: 10 },
    { id: 'LO-2', domain: 'logic', key: 'suite3' },
    { id: 'M-3', domain: 'memory', key: 4 },
    { id: 'TR-3', domain: 'trace', key: 'TR-3' },
    { id: 'NA-4', domain: 'nature', key: ['flamant', 'poisson', 'serpent'] },
    { id: 'P-3', domain: 'countries', key: ['nigeria', 'cameroun', 'niger', 'benin'] },
    { id: 'MU-2', domain: 'music', key: 4 },
    { id: 'AR-2', domain: 'art', key: 'case' },
    { id: 'LO-3', domain: 'logic', key: 'intrus' },
    { id: 'MU-3', domain: 'music', key: 5 },
    { id: 'AR-3', domain: 'art', key: 'poisson' },
    { id: 'AR-4', domain: 'art', key: 'baobab' }
  ],

  // Garage : véhicules et pilotes se débloquent avec les étoiles (jamais retirés une fois gagnés).
  vehicles: [
    { e: '🏍️', name: 'Moto', need: 0 }, { e: '🛵', name: 'Scooter', need: 0 },
    { e: '🚗', name: 'Voiture', need: 3 }, { e: '🚙', name: '4x4', need: 6 },
    { e: '🚕', name: 'Taxi', need: 9 }, { e: '🛻', name: 'Pick-up', need: 13 },
    { e: '🚌', name: 'Bus', need: 17 }, { e: '🚜', name: 'Tracteur', need: 21 },
    { e: '🚑', name: 'Ambulance', need: 26 }, { e: '🚒', name: 'Pompiers', need: 32 }
  ],
  pilots: [
    { e: '🦁', name: 'Lumi', need: 0 }, { e: '👦🏿', name: 'Abdou', need: 0 },
    { e: '👧🏿', name: 'Awa', need: 0 }, { e: '🧒🏿', name: 'Moussa', need: 2 },
    { e: '🐒', name: 'Singe', need: 5 }, { e: '🐘', name: 'Éléphant', need: 8 },
    { e: '🦒', name: 'Girafe', need: 12 }, { e: '🐢', name: 'Tortue', need: 16 },
    { e: '🐆', name: 'Léopard', need: 22 }, { e: '🦓', name: 'Zèbre', need: 28 }
  ],
  obstacles: ['🪨', '🐄'],
  // Missions : objets à ramasser, nombre à atteindre, part d'obstacles (bad), vitesse, décor.
  missions: [
    { id: 'mangues', title: 'Les mangues', icon: '🥭', items: ['🥭'], goal: 8, bad: 0.3, speed: 0.42, theme: 'savane' },
    { id: 'bananes', title: 'Les bananes', icon: '🍌', items: ['🍌'], goal: 8, bad: 0.35, speed: 0.45, theme: 'savane' },
    { id: 'coco', title: 'Les noix de coco', icon: '🥥', items: ['🥥'], goal: 7, bad: 0.35, speed: 0.46, theme: 'desert' },
    { id: 'marche', title: 'Livraison au marché', icon: '🧺', items: ['🥭', '🍌', '🥥'], goal: 10, bad: 0.4, speed: 0.48, theme: 'savane' },
    { id: 'animaux', title: 'Sauve les animaux', icon: '🦒', items: ['🐘', '🐒', '🦒'], goal: 8, bad: 0.4, speed: 0.5, theme: 'desert' },
    { id: 'etoiles', title: 'Chasse aux étoiles', icon: '⭐', items: ['⭐'], goal: 12, bad: 0.25, speed: 0.52, theme: 'nuit' },
    { id: 'tresor', title: 'Le trésor du baobab', icon: '💎', items: ['💎', '🪙'], goal: 10, bad: 0.4, speed: 0.55, theme: 'nuit' }
  ],

  stickers: ['🌳', '🥁', '🌺', '🥭', '🐘', '🦒', '🌞', '🛖', '🦋', '🐠', '🦓', '🌍', '🦜', '🐒', '🐊', '🦛', '🦏', '🐆', '🌴', '🪘', '🏺', '🌾', '🐓', '🐄', '⛵',
    '🦩', '🐍', '🐟', '🦅', '🦎', '🐜', '🌅', '🏜️', '🪶', '🥥', '🍌', '🌿', '🌻', '🌈', '🎶', '🎨', '🧩', '🔺', '🔵', '🟡', '🟢', '🟣', '🟠'],

  avatars: [
    { id: 'awa',    hair: 'buns',  shirt: '#7a45c4' },
    { id: 'abdou',  hair: 'short', shirt: '#2e9e5b' },
    { id: 'fanta',  hair: 'wrap',  shirt: '#f0605a' },
    { id: 'moussa', hair: 'short', shirt: '#1fa6a6' }
  ],

  stories: [
    { id: 'mangue', title: 'Abdou et la mangue', cover: '🥭', pages: [
      { img: '🌳🏠', text: 'Abdou se réveille. Le soleil brille sur le baobab.' },
      { img: '🥭🌳', text: 'Dans le jardin, il voit une grosse mangue jaune.' },
      { img: '🦁🥭', text: 'Lumi le lion a faim. Abdou partage la mangue avec lui.' },
      { img: '😋🥭🦁', text: 'Miam ! Partager, c’est encore meilleur. Fin !' }
    ] },
    { id: 'baobab', title: 'Le grand baobab', cover: '🌳', pages: [
      { img: '🌳☀️', text: 'Au bout du village, il y a un très grand baobab.' },
      { img: '🐒🌳', text: 'Un petit singe se cache dans ses branches.' },
      { img: '🦜🌳', text: 'Un perroquet vient chanter dans les feuilles.' },
      { img: '👦🌳', text: 'Abdou s’assoit à l’ombre et écoute les oiseaux.' },
      { img: '🌙🌳', text: 'Le soir, le baobab dit bonne nuit à tout le monde.' }
    ] },
    { id: 'tambour', title: 'Le petit tambour', cover: '🥁', pages: [
      { img: '🥁👦', text: 'Abdou trouve un petit tambour dans la case.' },
      { img: '🥁🎵', text: 'Boum, boum, boum ! Le tambour fait de la musique.' },
      { img: '🐘🎵', text: 'L’éléphant arrive et danse doucement.' },
      { img: '🦁🥁', text: 'Lumi tape avec ses grosses pattes : boum, boum !' },
      { img: '🎉🥁', text: 'Tout le village danse. Quelle belle fête !' }
    ] },
    { id: 'pluie', title: 'La pluie arrive', cover: '🌧️', pages: [
      { img: '☁️🌍', text: 'De gros nuages arrivent dans le ciel.' },
      { img: '🌧️🏠', text: 'Plic, ploc ! La pluie tombe sur le toit.' },
      { img: '🐸🌧️', text: 'Les grenouilles sautent de joie dans les flaques.' },
      { img: '🌈🌳', text: 'Puis le soleil revient et un arc-en-ciel apparaît !' }
    ] },
    { id: 'marche', title: 'Au marché', cover: '🧺', pages: [
      { img: '🧺👦', text: 'Abdou va au marché avec son panier.' },
      { img: '🥭🍌🥥', text: 'Il voit des mangues, des bananes et des noix de coco.' },
      { img: '1️⃣2️⃣3️⃣', text: 'Il choisit trois fruits : un, deux, trois !' },
      { img: '😊🧺', text: 'Il rentre à la maison avec un panier bien rempli.' }
    ] },

    // ---- Contes d'Afrique (récits courts, réécrits pour les petits ; scènes dessinées en SVG) ----
    { id: 'anansi', tale: true, title: 'Anansi et la calebasse de sagesse', cover: '🕷️',
      origin: 'Inspiré d’un conte akan (Ghana), réécrit pour les petits.', pages: [
      { scene: 'village', chars: ['🕷️'], text: 'Il y a très longtemps, Anansi l’araignée croyait que toute la sagesse du monde lui appartenait.' },
      { scene: 'village', chars: ['🕷️', '🏺'], text: 'Il la rangea dans une grande calebasse, pour la garder rien que pour lui.' },
      { scene: 'baobab', chars: ['🕷️', '🌳'], text: 'Il voulut la cacher tout en haut d’un baobab. Mais la calebasse était devant lui, et il n’arrivait pas à grimper.' },
      { scene: 'baobab', chars: ['🧒🏿', '🕷️'], text: 'Son petit garçon lui dit : « Papa, mets-la dans ton dos ! » Anansi n’y avait jamais pensé.' },
      { scene: 'savane', chars: ['🕷️', '🏺'], text: 'Fâché, Anansi lâcha la calebasse. Elle se brisa, et la sagesse s’envola pour tout le monde.' },
      { scene: 'village', chars: ['🕷️', '🧒🏿', '👧🏿'], text: 'Anansi comprit que personne ne sait tout. La sagesse grandit quand on la partage.' }
    ] },
    { id: 'lievre', tale: true, title: 'Le lièvre, l’éléphant et l’hippopotame', cover: '🐇',
      origin: 'Conte d’Afrique de l’Ouest, réécrit pour les petits.', pages: [
      { scene: 'savane', chars: ['🐇'], text: 'Le petit lièvre voulait montrer qu’il était malin.' },
      { scene: 'savane', chars: ['🐇', '🐘'], text: 'Il dit à l’éléphant : « Jouons à tirer la corde ! » Et l’éléphant éclata de rire.' },
      { scene: 'fleuve', chars: ['🐇', '🦛'], text: 'Il dit la même chose à l’hippopotame, dans le fleuve. Les deux grands acceptèrent.' },
      { scene: 'savane', chars: ['🐘', '🪢', '🦛'], text: 'Le lièvre tendit une longue corde entre eux deux, puis alla se cacher dans les herbes.' },
      { scene: 'fleuve', chars: ['🐘', '🦛'], text: 'L’éléphant tirait, l’hippopotame tirait… Aucun ne gagnait ! Ils étaient aussi forts l’un que l’autre.' },
      { scene: 'savane', chars: ['🐘', '🐇', '🦛'], text: 'Ils virent le lièvre rire derrière un buisson. Alors tout le monde rit, et ils devinrent amis.' }
    ] },
    { id: 'griot', tale: true, title: 'Le griot et le baobab qui écoute', cover: '🎶',
      origin: 'Histoire originale, inspirée de la tradition des griots (Mandingue).', pages: [
      { scene: 'village', chars: ['🧓🏿', '🎶'], text: 'Au village, le vieux griot chantait chaque soir en jouant de sa kora.' },
      { scene: 'baobab', chars: ['🌳'], text: 'Au bord du chemin, un petit baobab, tout triste, n’avait jamais entendu de musique.' },
      { scene: 'baobab', chars: ['🧓🏿', '🌳'], text: 'Le griot s’assit près de lui et chanta doucement l’histoire du village.' },
      { scene: 'nuit', chars: ['🌳', '🎶'], text: 'Dans la nuit, le petit baobab écoutait, et ses feuilles se mirent à danser.' },
      { scene: 'village', chars: ['👧🏿', '🌳', '👦🏿'], text: 'Depuis ce jour, les enfants viennent chanter sous le baobab, et il pousse un peu plus haut chaque année.' }
    ] },
    { id: 'tortue', tale: true, title: 'La tortue qui voulait voler', cover: '🐢',
      origin: 'Conte d’Afrique de l’Ouest, réécrit pour les petits.', pages: [
      { scene: 'savane', chars: ['🐢'], text: 'La tortue rêvait de voler dans le ciel, comme les oiseaux.' },
      { scene: 'savane', chars: ['🐢', '🐦', '🦜'], text: 'Les oiseaux l’invitèrent à leur grande fête, et chacun lui prêta une plume.' },
      { scene: 'savane', chars: ['🐢', '🪶', '☁️'], text: 'Avec les plumes, la tortue s’envola, toute fière !' },
      { scene: 'savane', chars: ['🐢', '😔', '🐦'], text: 'Mais elle se vanta sans arrêt, et elle oublia de dire merci. Les oiseaux étaient tristes.' },
      { scene: 'savane', chars: ['🐢', '🐦'], text: 'Elle redescendit doucement et dit : « Merci, mes amis, pour ces belles plumes ! »' },
      { scene: 'village', chars: ['🐢', '🦜', '🐦'], text: 'Depuis ce jour, la tortue sait qu’un petit merci ouvre tous les cœurs.' }
    ] },
    { id: 'awa-eau', tale: true, title: 'Awa et la calebasse d’eau', cover: '🏺',
      origin: 'Histoire originale, inspirée des contes de partage d’Afrique de l’Ouest.', pages: [
      { scene: 'village', chars: ['👧🏿', '🏺'], text: 'Chaque matin, Awa porte une calebasse d’eau jusqu’à la maison.' },
      { scene: 'savane', chars: ['🐘', '👧🏿'], text: 'En chemin, elle voit un petit éléphant très assoiffé.' },
      { scene: 'savane', chars: ['👧🏿', '🏺', '🐘'], text: 'Awa lui donne un peu d’eau, même si elle en a besoin elle aussi.' },
      { scene: 'fleuve', chars: ['🌧️', '🏺'], text: 'Le soir, la pluie arrive et remplit la calebasse jusqu’au bord !' },
      { scene: 'village', chars: ['👧🏿', '🐘', '🌈'], text: 'Partager, c’est toujours une belle idée.' }
    ] }
  ]
};

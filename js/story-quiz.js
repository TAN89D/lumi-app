// Questions de compréhension des dix histoires (français + anglais). Les textes des contes ne sont PAS modifiés : la question vient APRÈS la fin.
// Chaque question : une seule bonne réponse (ok), des distracteurs absents du récit. kw = mot qui prouve la réponse dans le texte (vérifié par les tests).
// À 3 ans : 2 réponses ; à 4 et 5 ans : 3 réponses. La place de la bonne réponse est tirée au hasard. Aucune donnée n'est enregistrée par ce module.
window.StoryQuiz = (function () {
  // c(emoji, fr, en, kwFr, kwEn) ; ko = faux
  const R = (e, fr, en, kfr, ken) => ({ e, fr, en, kfr, ken });
  const Q = {
    mangue: { fr: 'Qu’est-ce qu’Abdou partage avec Lumi ?', en: 'What does Abdou share with Lumi?',
      ok: R('🥭', 'la mangue', 'the mango', 'mangue', 'mango'), ko: [R('🍌', 'une banane', 'a banana', 'banane', 'banana'), R('🥥', 'une noix de coco', 'a coconut', 'noix de coco', 'coconut')] },
    baobab: { fr: 'Quel arbre se trouve dans le village ?', en: 'Which tree is in the village?',
      ok: R('🌳', 'le baobab', 'the baobab', 'baobab', 'baobab'), ko: [R('🌴', 'un palmier', 'a palm tree', 'palmier', 'palm'), R('🍎', 'un pommier', 'an apple tree', 'pommier', 'apple')] },
    tambour: { fr: 'Quel instrument joue Abdou ?', en: 'Which instrument does Abdou play?',
      ok: R('🥁', 'le tambour', 'the drum', 'tambour', 'drum'), ko: [R('🎹', 'un piano', 'a piano', 'piano', 'piano'), R('🎺', 'une trompette', 'a trumpet', 'trompette', 'trumpet')] },
    pluie: { fr: 'Que voit-on après la pluie ?', en: 'What do we see after the rain?',
      ok: R('🌈', 'un arc-en-ciel', 'a rainbow', 'arc-en-ciel', 'rainbow'), ko: [R('❄️', 'de la neige', 'snow', 'neige', 'snow'), R('🌙', 'la lune', 'the moon', 'lune', 'moon')] },
    marche: { fr: 'Qu’est-ce qu’Abdou porte ?', en: 'What does Abdou carry?',
      ok: R('🧺', 'un panier', 'a basket', 'panier', 'basket'), ko: [R('🎒', 'un sac à dos', 'a backpack', 'sac à dos', 'backpack'), R('👒', 'un chapeau', 'a hat', 'chapeau', 'hat')] },
    anansi: { fr: 'Comment la sagesse grandit-elle ?', en: 'How does wisdom grow?',
      ok: R('🤝', 'quand on la partage', 'when we share it', 'partage', 'share'), ko: [R('😴', 'quand on dort', 'when we sleep', 'dort', 'sleep'), R('🏆', 'quand on gagne', 'when we win', 'gagne', ' win')] },
    lievre: { fr: 'Quels animaux tirent la corde ?', en: 'Which animals pull the rope?',
      ok: R('🐘', 'l’éléphant et l’hippopotame', 'the elephant and the hippo', 'hippopotame', 'hippo'), ko: [R('🦒', 'la girafe et le zèbre', 'the giraffe and the zebra', 'girafe', 'giraffe'), R('🐒', 'le singe et le perroquet', 'the monkey and the parrot', 'singe', 'monkey')] },
    griot: { fr: 'De quel instrument joue le griot ?', en: 'Which instrument does the griot play?',
      ok: R('🪕', 'la kora', 'the kora', 'kora', 'kora'), ko: [R('🎸', 'une guitare', 'a guitar', 'guitare', 'guitar'), R('🎷', 'un saxophone', 'a saxophone', 'saxophone', 'saxophone')] },
    tortue: { fr: 'Que dit la tortue aux oiseaux ?', en: 'What does the tortoise say to the birds?',
      ok: R('🙏', '« Merci ! »', '“Thank you!”', 'merci', 'thank you'), ko: [R('😠', '« Va-t’en ! »', '“Go away!”', 'va-t’en', 'go away'), R('👋', '« Au revoir ! »', '“Goodbye!”', 'au revoir', 'goodbye')] },
    'awa-eau': { fr: 'Quel animal avait soif ?', en: 'Which animal was thirsty?',
      ok: R('🐘', 'le petit éléphant', 'the little elephant', 'éléphant', 'elephant'), ko: [R('🐒', 'le singe', 'the monkey', 'singe', 'monkey'), R('🦁', 'le lion', 'the lion', 'lion', 'lion')] }
  };
  const ids = () => Object.keys(Q);
  const FOLLOWUP = {
    mangue: { fr: 'Pourquoi Abdou partage-t-il sa mangue avec Lumi ?', en: 'Why does Abdou share his mango with Lumi?',
      ok: R('🦁', 'Parce que Lumi a faim', 'Because Lumi is hungry'), ko: [R('💤', 'Parce que Lumi veut dormir', 'Because Lumi wants to sleep'), R('🧺', 'Parce que Lumi va au marché', 'Because Lumi is going to the market')] },
    pluie: { fr: 'Pourquoi les grenouilles ont-elles des flaques où sauter ?', en: 'Why are there puddles for the frogs to jump in?',
      ok: R('🌧️', 'Parce qu’il a plu', 'Because it rained'), ko: [R('☀️', 'Parce que le soleil a brillé', 'Because the sun shone'), R('🌈', 'Parce qu’un arc-en-ciel est apparu', 'Because a rainbow appeared')] },
    'awa-eau': { fr: 'Qu’est-ce qui remplit de nouveau la calebasse ?', en: 'What fills the calabash again?',
      ok: R('🌧️', 'La pluie', 'The rain'), ko: [R('🐘', 'Le petit éléphant', 'The little elephant'), R('☀️', 'Le soleil', 'The sun')] }
  };
  const has = id => !!Q[id];
  const lang = l => (l === 'en' ? 'en' : 'fr');
  const shuffle = (a, rnd) => { const r = rnd || Math.random, b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  // Nombre de réponses selon l'âge : 3 ans → 2, 4 et 5 ans → 3.
  const choiceCount = age => (+age <= 3 ? 2 : 3);

  // Fabrique une question prête à afficher : { id, q, choices:[{e, label, ok}], count }. rnd (facultatif) = générateur aléatoire (tests).
  function build(storyId, language, age, rnd) {
    return question(Q[storyId], storyId, language, age, rnd);
  }
  function followup(storyId, language, age) {
    return age >= 6 ? question(FOLLOWUP[storyId], storyId + '.followup', language, age) : null;
  }
  function question(d, storyId, language, age, rnd) {
    if (!d) return null;
    const lg = lang(language), n = choiceCount(age), r = rnd || Math.random;
    const wrong = shuffle(d.ko, r).slice(0, n - 1);
    const choices = shuffle([Object.assign({ ok: true }, d.ok)].concat(wrong.map(w => Object.assign({ ok: false }, w))), r).map(c => ({ e: c.e, label: c[lg], ok: c.ok }));
    return { id: storyId, q: d[lg], choices, count: n };
  }
  // Règle de validation : seule la bonne réponse réussit ; une mauvaise réponse ne coûte rien (on peut réessayer ou passer).
  const check = (question, index) => !!(question && question.choices[index] && question.choices[index].ok);
  // Pour les tests : textes d'une question dans une langue (sans tirage).
  const raw = (storyId, language) => { const d = Q[storyId], lg = lang(language); return d && { q: d[lg], ok: d.ok, ko: d.ko, kwOk: d.ok[lg === 'en' ? 'ken' : 'kfr'], kwKo: d.ko.map(k => k[lg === 'en' ? 'ken' : 'kfr']) }; };

  return { ids, has, build, followup, check, choiceCount, raw };
})();

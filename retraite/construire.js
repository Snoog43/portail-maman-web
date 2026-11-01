// Tire de la page du plan retraite (https://snoog43.github.io/plan-retraite/) l'onglet « Plan héritage 50+ »
// et les comparatifs, sans le plan du foyer. Utilisé en direct par index.html, et par outils/secours.mjs
// pour la copie de secours. Lève une erreur si la page source a trop changé.
export function construire(s) {
  s = s.replace(/\r\n/g, '\n');
  const verifier = (ok, quoi) => { if (!ok) throw new Error('plan retraite modifié : ' + quoi); };
  const rep = (a, b) => { verifier(s.split(a).length === 2, a.slice(0, 50)); s = s.replace(a, () => b); };
  const sub = (re, b, n) => {
    let k = 0;
    s = s.replace(re, (...m) => { k++; return b.replace(/\$(\d)/g, (_, i) => m[i]); });
    verifier(n == null ? k > 0 : k === n, String(re).slice(0, 50));
  };

  // sections du plan du foyer
  for (const only of ['resume', 'invest'])
    sub(new RegExp(`\\n  <section class="tool"[^>]*data-only="${only}">.*?\\n  </section>\\n`, 'gs'), '\n');
  // sources propres au foyer (chômage, handicap)
  sub(/\n      <div class="source-group"><h3>Retraite, AAH et autisme<\/h3>.*?<\/ul><\/div>/s, '', 1);
  sub(/\n        <li><a href="https:\/\/(www\.francetravail\.fr|www\.lassuranceretraite\.fr|lozere\.fr|www\.monparcourshandicap\.gouv\.fr)\/[^\n]*/g, '', 5);

  // tableau PLAN : seulement les phases des parents
  const debut = s.indexOf('const PLAN = [\n') + 'const PLAN = [\n'.length, fin = s.indexOf('\n];', debut);
  verifier(debut > 20 && fin > debut, 'PLAN');
  const phases = s.slice(debut, fin + 1).match(/  \{\n.*?\n  \},?\n/gs) || [];
  const gardees = phases.filter(p => p.includes('tab: "parents"')).map(p => p.replace(/,?\n$/, ''));
  verifier(gardees.length > 0, 'phases des parents');
  s = s.slice(0, debut) + gardees.join(',\n') + s.slice(fin);
  sub(/const MILESTONES = \[.*?\n\];/s, 'const MILESTONES = [];', 1);
  sub(/const ANNUAL = \[.*?\n\];/s, 'const ANNUAL = [];', 1);

  // onglets : son plan et les comparatifs
  sub(/<nav class="tabs".*?<\/nav>/s, `<nav class="tabs" role="tablist" aria-label="Rubriques">
    <button type="button" role="tab" data-tab="parents" aria-selected="true">Mon plan</button>
    <button type="button" role="tab" data-tab="compare" aria-selected="false">Infos / Où faire</button>
  </nav>`, 1);
  // « Mon plan » ne garde que les actions : le récapitulatif et la simulation passent dans les infos
  rep('aria-labelledby="where-m-title" data-only="parents"', 'aria-labelledby="where-m-title" data-only="compare"');
  rep('aria-labelledby="graph-m-title" data-only="parents"', 'aria-labelledby="graph-m-title" data-only="compare"');
  rep('Tableau complet dans l\'onglet Comparatifs.', 'Tableau complet dans l\'onglet Infos / Où faire.');
  rep('tab === "compare" ? "Comparatifs et simulations"', 'tab === "compare" ? "Infos et où faire"');
  sub(/const COMPARE_LEDE = ".*?";/, 'const COMPARE_LEDE = "Où placer quoi, les simulations et les comparatifs qui justifient le plan. Rien à cocher ici : les actions à faire sont dans « Mon plan ».";', 1);
  rep('.tabs button[data-tab="parents"] { margin-left: auto;', '.tabs button[data-tab="parents"] { margin-left: 0;');
  rep('let tab = "resume";', 'let tab = "parents";');
  rep('const TABS = ["resume", "invest", "mdph", "compare", "parents"];', 'const TABS = ["parents", "compare"];');
  rep('tab = TABS.includes(h) ? h : (TABS.includes(saved) ? saved : "resume");', 'tab = TABS.includes(h) ? h : (TABS.includes(saved) ? saved : "parents");');
  rep('localStorage.getItem("plan-tab")', 'localStorage.getItem("plan-heritage-tab")');
  rep('localStorage.setItem("plan-tab", tab)', 'localStorage.setItem("plan-heritage-tab", tab)');
  rep('const LS = "plan-retraite-checks";', 'const LS = "plan-heritage-checks";');

  // plus de simulateur du foyer
  rep('["s-init", "s-month", "s-rate", "s-age"].forEach(id => document.getElementById(id).addEventListener("input", simulate));', '');
  rep('loadLocal(); render(); simulate(); setSync();', 'loadLocal(); render(); setSync();');

  // textes qui s'adressent à elle
  sub(/<title>.*?<\/title>/, '<title>Mon plan héritage 50+</title>', 1);
  sub(/(<p class="lede" id="lede">).*?(<\/p>)/s, '$1$2', 1);
  rep('<span class="eyebrow">Plan sur 36 ans</span>', '<span class="eyebrow">Investissement et retraite</span>');
  rep('Chargement de ta progression…', 'Chargement de votre progression…');
  rep('tu la retrouves sur tous tes appareils', 'vous la retrouvez sur tous vos appareils');
  rep('Tes parents à 65 ans : quelle stratégie rapporte le plus', 'À 65 ans : quelle stratégie rapporte le plus');
  rep('Survole le graphique', 'Survolez le graphique');
  rep('Les cases cochées ici sont enregistrées comme celles du plan principal.', 'Cochez chaque étape quand elle est faite : votre progression reste enregistrée sur cet appareil.');
  sub(/<div class="rules">.*?\n    <\/div>\n  <\/section>/s, `<div class="rules">
      <div class="rule"><h3>Quand la bourse chute</h3><p>Une baisse de 30 à 50 % peut arriver avant la retraite. On ne vend rien et on continue les versements : on achète moins cher.</p></div>
      <div class="rule"><h3>Un seul ETF</h3><p>Un ETF Monde (WPEA dans les PEA), c'est tout. Pas d'actions individuelles, pas de crypto, pas de « bon plan » vu sur les réseaux.</p></div>
      <div class="rule"><h3>Le matelas d'abord</h3><p>S'il sert pour un imprévu, on le reconstitue avant de réinvestir. C'est lui qui évite de vendre au mauvais moment.</p></div>
      <div class="rule"><h3>Les frais comptent</h3><p>0,5 % de frais en plus par an coûte des dizaines de milliers d'euros. On refuse les produits de placement de la banque.</p></div>
      <div class="rule"><h3>Pas de timing</h3><p>N'attendez jamais « le bon moment » pour investir. Le calendrier fixé ici remplace toutes les prévisions.</p></div>
      <div class="rule"><h3>On ne retire pas</h3><p>PEA et assurances-vie restent intacts jusqu'à la retraite. Les projets se financent avec le matelas et l'épargne courante.</p></div>
    </div>
  </section>`, 1);
  // les règles aussi passent dans les infos, juste après la simulation
  const regles = s.match(/\n  <section class="tool" aria-labelledby="rules-title" data-only="invest parents">.*?\n  <\/section>\n/s);
  verifier(regles, 'règles');
  s = s.replace(regles[0], '\n');
  rep('\n  <section class="tool" aria-labelledby="proj-m-title"', regles[0].replace('data-only="invest parents"', 'data-only="compare"') + '\n  <section class="tool" aria-labelledby="proj-m-title"');
  // section.tool { display: flex } l'emporte sur l'attribut hidden : sans ça, chaque onglet montre tout
  rep('section.tool { display: flex;', '[hidden] { display: none !important; }\nsection.tool { display: flex;');
  // lien de retour vers le portail
  rep('<div class="wrap">\n  <header>', '<div class="wrap">\n  <p style="margin:0 0 8px"><a href="../" style="color:var(--chestnut)">← Mes sites</a></p>\n  <header>');
  return s;
}

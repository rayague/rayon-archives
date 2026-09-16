/**
 * ============================================================================
 * RAYON · main.js
 * ----------------------------------------------------------------------------
 * TROIS ÉTATS, ET RIEN ENTRE LES DEUX.
 *
 *   casier   le meuble, chaque case montrant sa pile
 *   déplié   une case ouverte : ses pièces occupent le plan de travail
 *   fiche    une pièce ouverte, lisible
 *
 * Chaque passage est un FLIP. Les fiches changent RÉELLEMENT de place dans le
 * DOM — elles quittent leur case pour le plan, puis y reviennent. Ce n'est pas
 * un décor : à tout moment, la structure du document dit la vérité sur ce qui
 * est rangé où.
 *
 * C'est aussi ce qui rend le retour exact. Fermer n'est pas « animer vers une
 * position calculée » mais rejouer le mécanisme dans l'autre sens : la fiche
 * retrouve sa place parce que le navigateur l'y remet, pas parce qu'on a
 * mémorisé des coordonnées.
 *
 * POURQUOI LA TAILLE DU TEXTE SUIT LA LARGEUR DE LA FICHE
 *
 * Une fiche est une page. Vue de loin elle est petite, ouverte elle est
 * grande, mais c'est la MÊME page. Sa taille de police est donc calculée
 * depuis sa largeur : le rapport entre deux états est identique pour la boîte
 * et pour le texte, et l'échelle du FLIP les décrit tous les deux. Un texte
 * qui garderait sa taille pendant que la boîte grandit trahirait le procédé à
 * chaque transition.
 *
 * CE QUI OUVRE UN CASIER
 *
 * Toute la case, et pas seulement son étiquette : sur un téléphone, on touche
 * la carte là où on la voit. Trois chemins mènent donc au même geste —
 * l'étiquette, qui est le vrai bouton et le seul chemin clavier ; la surface
 * de la case ; et un clic sur la pile, sous le seuil du porté. Sans ce
 * dernier, la pile — la plus grande cible de la case — avalait le clic sans
 * rien faire.
 * ============================================================================
 */

import gsap from 'gsap';
import { FONDS, GENRES } from './fonds.js';
import { creerDepliage } from './deplier.js';
import { monter, monterUne, lireAjouts, ecrireAjouts, creerEmplacement, CASCADE } from './monter.js';
import { STRUCTURE, casesAcompleter, colonnes, disposer, poserSocle } from './cadre.js';
import { creerRangement, lireClassement, ecrireClassement } from './ranger.js';

const REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function demarrer(racine) {
  const flip = creerDepliage({ gsap, reduit: REDUIT });

  const plan = racine.querySelector('[data-plan]');
  const meuble = racine.querySelector('[data-casiers]');
  const lecteur = racine.querySelector('[data-lecteur]');
  const compte = racine.querySelector('[data-compte]');

  let etat = 'casier';
  let ouvert = null;
  let lue = null;
  let anime = false;

  const fiches = new Map();     /* élément → { fonds, donnee } */
  const classement = lireClassement();

  /* LE RANGEMENT.

     Il ne connaît ni les fonds ni les fiches : il porte un élément et dit
     dans quelle case il a été lâché. C'est `deplacer` qui décide ce que ça
     veut dire — le geste et le sens restent séparés. */
  const rangement = creerRangement({
    gsap, meuble, reduit: REDUIT,
    etatCourant: () => etat,
    surDeplacement: (el, coteCible) => deplacer(el, coteCible)
  });

  function deplacer(el, coteCible) {
    const info = fiches.get(el);
    const vers = fonds.find(f => f.cote === coteCible);
    if (!info || !vers || vers === info.fonds) return;

    const de = info.fonds;
    const i = de.fiches.indexOf(info.donnee);
    if (i >= 0) de.fiches.splice(i, 1);
    vers.fiches.push(info.donnee);
    fiches.set(el, { fonds: vers, donnee: info.donnee });

    pileDe(vers).append(el);
    rangerLesRangs(de); rangerLesRangs(vers);
    majEtiquette(de); majEtiquette(vers);

    classement[el.dataset.piece] = vers.cote;
    ecrireClassement(classement);
  }

  /* Le décalage de la pile se lit sur --rang : après un déplacement, les
     rangs doivent redevenir 0,1,2… dans les deux casiers, sinon les fiches
     s'empilent avec des trous. `--pile` dit à la case combien de pièces
     elle porte : sa hauteur en dépend. */
  function rangerLesRangs(f) {
    const p = pileDe(f);
    if (!p) return;
    [...p.children].forEach((el, i) => el.style.setProperty('--rang', i));
    p.style.setProperty('--pile', p.children.length);
  }

  function majEtiquette(f) {
    const c = meuble.querySelector('[data-cote="' + f.cote + '"] .casier__compte');
    if (!c) return;
    const n = f.fiches.length;
    c.textContent = (n ? n + (n > 1 ? ' pièces' : ' pièce') : 'vide') + ' · ' + f.annee;
  }
  const fonds = [...FONDS];     /* les fonds du studio, plus ceux qu'on ajoute */

  /* ── construction ──────────────────────────────────────────────────────*/

  function construireCasier(f) {
    const casier = document.createElement('article');
    casier.className = 'casier';
    casier.dataset.cote = f.cote;
    casier.dataset.couleur = f.couleur;

    const n = f.fiches.length;
    casier.innerHTML =
      STRUCTURE +
      '<div class="casier__cible" aria-hidden="true"></div>' +
      '<button class="casier__prise" type="button" aria-expanded="false">' +
        '<span class="cote">' + f.cote + '</span>' +
        '<span class="casier__nom">' + echapper(f.titre) + '</span>' +
        '<span class="casier__sous">' + echapper(f.sousTitre) + '</span>' +
        '<span class="casier__compte">' + (n ? n + (n > 1 ? ' pièces' : ' pièce') : 'vide') +
          ' · ' + f.annee + '</span>' +
      '</button>' +
      '<div class="casier__pile" data-pile style="--pile:' + n + '"></div>';

    const pile = casier.querySelector('[data-pile]');
    f.fiches.forEach((d, i) => {
      const el = creerFiche(f, d, i);
      fiches.set(el, { fonds: f, donnee: d });
      pile.append(el);
    });

    /* Un seul geste, trois chemins : l'étiquette — le vrai bouton, et le
       seul que le clavier connaisse — et la surface de la case, pour que la
       carte s'ouvre là où le doigt la touche. */
    const basculer = () => (ouvert === f ? replier() : deplier(f));
    casier.querySelector('.casier__prise').addEventListener('click', basculer);
    casier.querySelector('.casier__cible').addEventListener('click', basculer);

    return casier;
  }

  /* Le contenu du studio est écrit à la main dans fonds.js, mais un titre
     saisi par le visiteur ne l'est pas. On l'échappe : un meuble où l'on
     nomme les cases est un meuble où l'on peut écrire n'importe quoi. */
  function echapper(s) {
    const d = document.createElement('span');
    d.textContent = String(s);
    return d.innerHTML;
  }

  function creerFiche(f, d, i) {
    const el = document.createElement('article');
    el.className = 'fiche';
    el.dataset.genre = d.genre;
    el.dataset.couleur = f.couleur;
    el.tabIndex = -1;
    el.style.setProperty('--rang', i);
    el.dataset.piece = f.cote + '.' + String(i + 1).padStart(2, '0');

    const corps = d.lignes
      ? '<dl class="fiche__mesures">' + d.lignes
          .map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>').join('') + '</dl>'
      : '<div class="fiche__texte">' + d.corps.map(p => '<p>' + p + '</p>').join('') + '</div>';

    el.innerHTML =
      '<header class="fiche__tete">' +
        '<span class="fiche__genre">' + GENRES[d.genre].icone + ' ' + GENRES[d.genre].nom + '</span>' +
        '<span class="fiche__cote">' + f.cote + '.' + String(i + 1).padStart(2, '0') + '</span>' +
      '</header>' +
      '<h3 class="fiche__titre">' + d.titre + '</h3>' + corps;

    el.addEventListener('click', ev => {
      ev.stopPropagation();
      /* Un porté se termine par un pointerup, qui déclenche aussi un clic.
         Sans ce garde-fou, ranger une fiche déplierait la case d'arrivée. */
      if (rangement && rangement.enCours()) return;
      if (etat === 'deplie') lire(el);
      else if (etat === 'fiche') fermerFiche();
      /* En mode meuble, un clic sous le seuil du porté déplie la case —
         c'est ce que le README promettait et que la pile avalait. */
      else if (fiches.has(el)) deplier(fiches.get(el).fonds);
    });

    rangement.brancher(el);
    return el;
  }

  /* ── l'emplacement vide, toujours en dernier ───────────────────────────*/

  const emplacement = creerEmplacement({ surNom: ajouter });

  /* Le bâti suit le nombre de cases ET le nombre de colonnes, qui change
     avec la largeur de l'écran. La dernière rangée est complétée par des
     cases vides : un meuble dont la rangée du bas s'arrête au milieu
     n'existe pas, on verrait les montants se poursuivre au-dessus du vide.
     Sur une seule colonne, il n'en faut jamais.

     Renvoie les cases de complément neuves — à charge de l'appelant de les
     construire, ou pas : un changement de largeur n'est pas un montage. */
  function poserEmplacement() {
    for (const b of meuble.querySelectorAll('.casier--bouchon')) b.remove();
    meuble.append(emplacement);

    const neuves = [];
    const cols = colonnes(meuble);
    const occupees = meuble.querySelectorAll('.casier').length;

    for (let i = 0; i < casesAcompleter(occupees, cols); i++) {
      const b = document.createElement('article');
      b.className = 'casier casier--bouchon';
      b.setAttribute('aria-hidden', 'true');
      b.innerHTML = STRUCTURE;
      meuble.append(b);
      neuves.push(b);
    }

    disposer(meuble);
    poserSocle(meuble);
    return neuves;
  }

  function ajouter(titre) {
    const f = {
      cote: 'PE.' + String(fonds.length + 1).padStart(2, '0'),
      titre,
      sousTitre: 'Casier ajouté',
      annee: String(new Date().getFullYear()),
      couleur: 'ajout',
      resume: '',
      fiches: [],
      ajoute: true
    };
    fonds.push(f);

    const el = construireCasier(f);
    meuble.insertBefore(el, emplacement);

    /* Le bâti d'abord : la case doit connaître sa rangée et ses faces avant
       de se construire. */
    const neuves = poserEmplacement();

    monterUne({ gsap, element: el, reduit: REDUIT });
    /* Si l'ajout a créé une étagère entière, ses cases de complément se
       construisent derrière la case neuve, en cascade de 90 ms. */
    neuves.forEach((b, i) =>
      monterUne({ gsap, element: b, reduit: REDUIT, decalage: (i + 1) * CASCADE }));

    ecrireAjouts(fonds.filter(x => x.ajoute).map(x => ({ titre: x.titre, annee: x.annee })));
    majCompte();
  }

  /* ── les transitions ───────────────────────────────────────────────────*/

  const toutes = () => [...fiches.keys()];

  function deplier(f) {
    if (anime || ouvert === f) return;

    /* Une case vide ne se déplie pas : il n'y aurait rien à montrer, et une
       animation qui ne montre rien passe pour une panne. */
    if (!f.fiches.length) { signalerVide(f); return; }

    anime = true;
    const prise = meuble.querySelector('[data-cote="' + f.cote + '"] .casier__prise');
    const r = prise.getBoundingClientRect();
    const origine = { x: r.left + r.width / 2, y: r.top + r.height / 2 };

    flip.transition(toutes(), () => {
      for (const [el, { fonds: g }] of fiches) {
        if (g === f) plan.append(el); else pileDe(g).append(el);
      }
      ouvert = f; etat = 'deplie'; appliquerEtat();
    }, {
      duree: 0.66,
      ordre: flip.parDistance(origine),
      surFin: () => { anime = false; plan.querySelector('.fiche')?.focus(); }
    });
  }

  function signalerVide(f) {
    const prise = meuble.querySelector('[data-cote="' + f.cote + '"] .casier__prise');
    if (REDUIT) return;
    gsap.fromTo(prise, { x: -3 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
  }

  function replier() {
    if (anime || !ouvert) return;
    anime = true;
    flip.transition(toutes(), () => {
      for (const [el, { fonds: g }] of fiches) pileDe(g).append(el);
      ouvert = null; lue = null; etat = 'casier'; appliquerEtat();
    }, { duree: 0.58, surFin: () => { anime = false; } });
  }

  function lire(el) {
    if (anime) return;
    anime = true;
    flip.transition(toutes(), () => {
      lecteur.append(el); lue = el; etat = 'fiche'; appliquerEtat();
    }, { duree: 0.6, decalage: 0, surFin: () => { anime = false; el.focus(); } });
  }

  function fermerFiche() {
    if (anime || !lue) return;
    anime = true;
    const cible = lue;
    flip.transition(toutes(), () => {
      plan.append(cible);
      /* On la remet à son rang : sans ça, la fiche lue revient toujours en
         dernier et l'ordre du plan change à chaque lecture. */
      [...plan.children]
        .sort((a, b) => (+a.style.getPropertyValue('--rang')) - (+b.style.getPropertyValue('--rang')))
        .forEach(el => plan.append(el));
      lue = null; etat = 'deplie'; appliquerEtat();
    }, { duree: 0.55, decalage: 0, surFin: () => { anime = false; cible.focus(); } });
  }

  const pileDe = f => meuble.querySelector('[data-cote="' + f.cote + '"] [data-pile]');

  function appliquerEtat() {
    racine.dataset.etat = etat;
    for (const c of meuble.querySelectorAll('.casier[data-cote]')) {
      const actif = ouvert && c.dataset.cote === ouvert.cote;
      c.classList.toggle('casier--ouvert', !!actif);
      c.querySelector('.casier__prise').setAttribute('aria-expanded', actif ? 'true' : 'false');
    }
    for (const el of fiches.keys()) el.tabIndex = (etat === 'casier') ? -1 : 0;
  }

  function majCompte() {
    if (compte) compte.textContent = 'Fonds du studio · ' + fonds.length + ' casiers';
  }

  /* ── le clavier ────────────────────────────────────────────────────────
     Échap remonte d'un cran, jamais deux : on ne fait pas disparaître deux
     niveaux sur une seule touche. */

  addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    if (etat === 'fiche') fermerFiche();
    else if (etat === 'deplie') replier();
  });

  /* ── la largeur de l'écran ─────────────────────────────────────────────
     Un, deux ou trois casiers par étagère : c'est le CSS qui tranche, le
     JavaScript ne fait que suivre — recompter les cases de complément et
     retourner les faces des montants. Un changement de largeur ne construit
     rien : le meuble est déjà monté. */

  for (const largeur of ['(min-width: 768px)', '(min-width: 1024px)']) {
    matchMedia(largeur).addEventListener('change', () => poserEmplacement());
  }

  /* ── mise en place ─────────────────────────────────────────────────────*/

  for (const f of FONDS) meuble.append(construireCasier(f));

  for (const a of lireAjouts()) {
    const f = { cote: 'PE.' + String(fonds.length + 1).padStart(2, '0'), titre: a.titre,
                sousTitre: 'Casier ajouté', annee: a.annee || String(new Date().getFullYear()),
                couleur: 'ajout', resume: '', fiches: [], ajoute: true };
    fonds.push(f);
    meuble.append(construireCasier(f));
  }

  /* Le classement mémorisé s'applique APRÈS que tout est construit : on
     déplace des fiches qui existent déjà, plutôt que de les créer au bon
     endroit — une seule voie pour déplacer, testée par le geste. */
  for (const [piece, cote] of Object.entries(classement)) {
    const el = meuble.querySelector('[data-piece="' + piece + '"]');
    if (el && meuble.querySelector('[data-cote="' + cote + '"]')) deplacer(el, cote);
  }

  poserEmplacement();
  majCompte();
  appliquerEtat();
  monter({ gsap, meuble, reduit: REDUIT });

  /* Point d'entrée pour les sondes : le retour exact est la promesse de ce
     projet, et une promesse se mesure. */
  return {
    get etat() { return etat; },
    get ouvert() { return ouvert && ouvert.cote; },
    fiches, fonds, deplier, replier, lire, fermerFiche, ajouter,
    fondsParCote: c => fonds.find(f => f.cote === c),
    positions: () => {
      const m = {};
      for (const el of fiches.keys()) {
        const r = el.getBoundingClientRect();
        m[el.querySelector('.fiche__cote').textContent] =
          [Math.round(r.left * 100) / 100, Math.round(r.top * 100) / 100, Math.round(r.width * 100) / 100];
      }
      return m;
    }
  };
}

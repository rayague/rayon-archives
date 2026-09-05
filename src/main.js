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
 * ============================================================================
 */

import gsap from 'gsap';
import { FONDS, GENRES } from './fonds.js';
import { creerDepliage } from './deplier.js';
import { monter, monterUne, lireAjouts, ecrireAjouts, creerEmplacement } from './monter.js';

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
  const fonds = [...FONDS];     /* les fonds du studio, plus ceux qu'on ajoute */

  /* ── construction ──────────────────────────────────────────────────────*/

  function construireCasier(f) {
    const casier = document.createElement('article');
    casier.className = 'casier';
    casier.dataset.cote = f.cote;
    casier.dataset.couleur = f.couleur;

    const n = f.fiches.length;
    casier.innerHTML =
      '<button class="casier__prise" type="button" aria-expanded="false">' +
        '<span class="cote">' + f.cote + '</span>' +
        '<span class="casier__nom">' + echapper(f.titre) + '</span>' +
        '<span class="casier__sous">' + echapper(f.sousTitre) + '</span>' +
        '<span class="casier__compte">' + (n ? n + (n > 1 ? ' pièces' : ' pièce') : 'vide') +
          ' · ' + f.annee + '</span>' +
      '</button>' +
      '<div class="casier__pile" data-pile></div>';

    const pile = casier.querySelector('[data-pile]');
    f.fiches.forEach((d, i) => {
      const el = creerFiche(f, d, i);
      fiches.set(el, { fonds: f, donnee: d });
      pile.append(el);
    });

    casier.querySelector('.casier__prise')
      .addEventListener('click', () => (ouvert === f ? replier() : deplier(f)));

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
      if (etat === 'deplie') lire(el);
      else if (etat === 'fiche') fermerFiche();
    });

    return el;
  }

  /* ── l'emplacement vide, toujours en dernier ───────────────────────────*/

  const emplacement = creerEmplacement({ surNom: ajouter });

  function poserEmplacement() { meuble.append(emplacement); }

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
    monterUne({ gsap, element: el, reduit: REDUIT });

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

  /* ── mise en place ─────────────────────────────────────────────────────*/

  for (const f of FONDS) meuble.append(construireCasier(f));

  for (const a of lireAjouts()) {
    const f = { cote: 'PE.' + String(fonds.length + 1).padStart(2, '0'), titre: a.titre,
                sousTitre: 'Casier ajouté', annee: a.annee || String(new Date().getFullYear()),
                couleur: 'ajout', resume: '', fiches: [], ajoute: true };
    fonds.push(f);
    meuble.append(construireCasier(f));
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

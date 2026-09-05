/**
 * ============================================================================
 * RAYON · deplier.js
 * ----------------------------------------------------------------------------
 * LE MOTEUR DU DÉPLIEMENT.
 *
 * On ne déplace pas des éléments : on change la mise en page, puis on ment
 * sur le passé. C'est la technique FLIP — First, Last, Invert, Play.
 *
 *   1. FIRST   on relève où chaque fiche se trouve, MAINTENANT, à l'écran.
 *   2. LAST    on modifie le DOM. Le navigateur recalcule tout d'un coup.
 *              Les fiches sont déjà à leur nouvelle place, sans transition.
 *   3. INVERT  on les renvoie visuellement à leur ancienne place par une
 *              transformation. À l'œil, rien n'a bougé.
 *   4. PLAY    on ramène cette transformation à zéro.
 *
 * POURQUOI PAS UNE ANIMATION DIRECTE
 *
 * Animer `left` et `top` fait recalculer la mise en page à chaque image, et
 * la mise en page est ce qui coûte le plus cher dans un navigateur. FLIP
 * n'anime que `transform`, qui ne coûte rien : le compositeur s'en charge,
 * sans repasser par le moteur de rendu.
 *
 * C'est ce qui permet de déplier vingt fiches à soixante images par seconde
 * sur un téléphone.
 *
 * TROIS PIÈGES, ET COMMENT ILS SONT ÉVITÉS
 *
 * L'ORIGINE DE TRANSFORMATION. Avec l'origine par défaut — le centre — la
 * translation et l'échelle se composent d'une manière qui oblige à corriger
 * le décalage à la main, et l'erreur se voit. Origine en haut à gauche : la
 * composition devient exacte, et le calcul tient en trois soustractions.
 *
 * L'ÉCHELLE NON UNIFORME. Étirer un texte différemment en largeur et en
 * hauteur le déforme. Toutes les fiches ont donc le même rapport de forme,
 * imposé en CSS : une seule échelle suffit, et le texte reste net.
 *
 * LA MESURE PENDANT UNE ANIMATION. `getBoundingClientRect` renvoie la boîte
 * TRANSFORMÉE. Le relevé « first » la prend telle quelle — c'est justement ce
 * qui rend une interruption fluide, on repart d'où l'œil en est. Mais le
 * relevé « last » exige des transformations remises à zéro, sinon on mesure
 * l'ancien mouvement au lieu de la nouvelle mise en page.
 * ============================================================================
 */

export function creerDepliage({ gsap, reduit = false } = {}) {

  /* ── 1. FIRST ────────────────────────────────────────────────────────────
     Telle quelle, transformations comprises. Interrompre un dépliement en
     cours doit repartir de ce que l'œil voit, pas d'une position théorique. */

  function relever(elements) {
    const m = new Map();
    for (const el of elements) m.set(el, el.getBoundingClientRect());
    return m;
  }

  /* ── 2 à 4. LAST, INVERT, PLAY ───────────────────────────────────────────

     `muter` est appelée entre les deux relevés : c'est elle qui change la
     mise en page. Tout ce qui suit est mécanique. */

  function jouer(elements, avant, {
    duree = 0.62,
    ease = 'power3.inOut',
    decalage = 0.028,
    ordre = null,           /* pour échelonner par distance plutôt qu'en file */
    surFin = null
  } = {}) {

    /* LAST — transformations à zéro, sinon on mesure le mouvement d'avant. */
    gsap.set(elements, { x: 0, y: 0, scale: 1, clearProps: 'transform' });

    const cibles = [];
    for (const el of elements) {
      const a = avant.get(el);
      const b = el.getBoundingClientRect();

      if (!a || !b.width || !a.width) { cibles.push(null); continue; }

      cibles.push({
        el,
        dx: a.left - b.left,
        dy: a.top - b.top,
        /* Une seule échelle : le rapport de forme est constant par
           construction, la largeur suffit donc à la décrire. */
        s: a.width / b.width
      });
    }

    if (reduit) {
      gsap.set(elements, { clearProps: 'transform,opacity' });
      if (surFin) surFin();
      return null;
    }

    const rangs = ordre ? ordre(cibles.filter(Boolean)) : null;

    const tl = gsap.timeline({ onComplete: () => {
      gsap.set(elements, { clearProps: 'transform' });
      if (surFin) surFin();
    }});

    cibles.forEach((c, i) => {
      if (!c) return;
      const rang = rangs ? rangs.get(c.el) : i;
      tl.fromTo(c.el,
        { x: c.dx, y: c.dy, scale: c.s, transformOrigin: '0 0' },
        { x: 0, y: 0, scale: 1, duration: duree, ease },
        rang * decalage);
    });

    return tl;
  }

  /* ── l'usage courant ─────────────────────────────────────────────────────
     Relever, muter, jouer. Trois lignes, et le navigateur ne fait qu'un seul
     recalcul de mise en page au lieu d'un par image. */

  function transition(elements, muter, options) {
    const avant = relever(elements);
    muter();
    return jouer(elements, avant, options);
  }

  /* Échelonner du plus proche au plus lointain du point de départ. Une file
     d'attente par index donne une vague qui traverse la grille sans rapport
     avec l'endroit d'où les fiches sortent ; par distance, elles semblent
     jaillir de leur casier. */

  function parDistance(origine) {
    return cibles => {
      const avec = cibles.map(c => {
        const r = c.el.getBoundingClientRect();
        const dx = r.left + r.width / 2 - origine.x;
        const dy = r.top + r.height / 2 - origine.y;
        return { el: c.el, d: Math.hypot(dx, dy) };
      }).sort((a, b) => a.d - b.d);

      const m = new Map();
      avec.forEach((x, i) => m.set(x.el, i));
      return m;
    };
  }

  return { relever, jouer, transition, parDistance };
}

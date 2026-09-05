import { demarrer } from './main.js';

const racine = document.querySelector('[data-rayon]');
const rayon = demarrer(racine);

/* Le bouton « Ranger » remonte d'un cran, comme Échap. Deux chemins vers le
   même geste : la souris et le clavier ne doivent pas avoir des pouvoirs
   différents. */
racine.querySelector('[data-sortie]').addEventListener('click', () => {
  if (rayon.etat === 'fiche') rayon.fermerFiche();
  else rayon.replier();
});

/* Cliquer le fond range aussi — mais seulement le fond, jamais une fiche. */
racine.querySelector('.scene').addEventListener('click', ev => {
  if (ev.target.closest('.fiche') || ev.target.closest('.casier')) return;
  if (rayon.etat === 'fiche') rayon.fermerFiche();
  else if (rayon.etat === 'deplie') rayon.replier();
});

window.RAYON = rayon;

/* GSAP exposé pour que les sondes avancent le temps : Chrome sans fenêtre
   étrangle requestAnimationFrame, et un test qui attend y mesure le
   navigateur au lieu du produit. */
import gsap from 'gsap';
window.RAYON_GSAP = gsap;

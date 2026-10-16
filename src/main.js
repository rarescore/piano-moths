import { HeroScene } from './scene.js';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const hint = document.getElementById('hint');
setTimeout(() => {
  if (hint) hint.style.opacity = '0';
}, 4200);

const hero = new HeroScene(canvas);
hero.start();

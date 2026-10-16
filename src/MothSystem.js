import * as THREE from 'three';
import { Moth } from './Moth.js';

/**
 * Spawns and manages moths. Each key press triggers a burst.
 * Exposes mothCount so the distortion layer can read density.
 */
export class MothSystem {
  constructor(scene, piano) {
    this.scene = scene;
    this.piano = piano;
    this.moths = [];
    this.mothCount = 0;
    this._burstQueue = [];
    this._spawnAcc = 0;
  }

  triggerBurst(keyIndex, intensity = 1.0) {
    const key = this.piano.keys[keyIndex];
    if (!key) return;
    const origin = new THREE.Vector3();
    key.getWorldPosition(origin);
    origin.y += 0.08;
    const count = Math.floor(3 + intensity * 7);
    for (let i = 0; i < count; i++) {
      this._burstQueue.push({ origin: origin.clone(), delay: i * 0.04 });
    }
  }

  update(dt, time) {
    // process spawn queue
    this._spawnAcc += dt;
    while (this._burstQueue.length && this._spawnAcc > 0) {
      const next = this._burstQueue[0];
      if (this._spawnAcc >= next.delay) {
        this._burstQueue.shift();
        this._spawnAcc -= next.delay;
        const m = new Moth();
        m.position.copy(next origin);
        this.scene.add(m);
        this.moths.push(m);
      } else break;
    }

    // update + cull
    for (let i = this.moths.length - 1; i >= 0; i--) {
      const m = this.moths[i];
      m.update(dt, time);
      if (!m.alive) {
        this.scene.remove(m);
        m.traverse((o) => {
          if (o.geometry) o.geometry dispose();
          if (o.material) o.material dispose();
        });
        this.moths.splice(i, 1);
      }
    }
    this.mothCount = this.moths.length;
  }
}

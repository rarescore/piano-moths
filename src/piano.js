import * as THREE from 'three';
import {
  createPianoBodyMaterial,
  createKeyWhiteMaterial,
  createKeyBlackMaterial,
} from './materials/pianoMaterial.js';

export class Piano extends THREE.Group {
  constructor() {
    super();
    this.keys = [];
    this.keyStates = [];
    this._buildBody();
    this._buildKeys();
  }

  _buildBody() {
    const bodyMat = createPianoBodyMaterial();
    const caseGeo = new THREE.BoxGeometry(2.4, 0.18, 1.1);
    const caseMesh = new THREE.Mesh(caseGeo, bodyMat);
    caseMesh.position.y = 0.09;
    this.add(caseMesh);

    const lidGeo = new THREE.BoxGeometry(2.35, 0.025, 1.05);
    const lid = new THREE.Mesh(lidGeo, bodyMat);
    lid.position.set(0, 0.42, -0.08);
    lid.rotation.x = -0.35;
    this.add(lid);

    const fallGeo = new THREE.BoxGeometry(2.2, 0.12, 0.06);
    const fall = new THREE.Mesh(fallGeo, bodyMat);
    fall.position.set(0, 0.22, 0.48);
    this.add(fall);
    this.fallboard = fall;

    const legGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.72, 12);
    for (const [x, z] of [[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.35], [0.9, 0.35]]) {
      const leg = new THREE.Mesh(legGeo, bodyMat);
      leg.position.set(x, -0.28, z);
      this.add(leg);
    }
  }

  _buildKeys() {
    const whiteMat = createKeyWhiteMaterial();
    const blackMat = createKeyBlackMaterial();
    const whiteW = 0.0235;
    const whiteD = 0.14;
    const whiteH = 0.022;
    const blackW = 0.014;
    const blackD = 0.09;
    const blackH = 0.03;
    const whiteCount = 36;
    const startX = -((whiteCount * whiteW) / 2) + whiteW / 2;

    for (let i = 0; i < whiteCount; i++) {
      const geo = new THREE.BoxGeometry(whiteW * 0.92, whiteH, whiteD);
      const key = new THREE.Mesh(geo, whiteMat);
      key.position.set(startX + i * whiteW, 0.19, 0.42);
      key.userData.baseY = 0.19;
      key.userData.isBlack = false;
      this.add(key);
      this.keys.push(key);
      this.keyStates.push(0);
    }

    const blackPattern = [1, 1, 0, 1, 1, 1, 0];
    for (let i = 0; i < whiteCount - 1; i++) {
      if (blackPattern[i % 7] === 1) {
        const geo = new THREE.BoxGeometry(blackW, blackH, blackD);
        const key = new THREE.Mesh(geo, blackMat);
        const x = startX + i * whiteW + whiteW * 0.55;
        key.position.set(x, 0.205, 0.37);
        key.userData.baseY = 0.205;
        key.userData.isBlack = true;
        this.add(key);
        this.keys.push(key);
        this.keyStates.push(0);
      }
    }
  }

  press(index, amount = 1) {
    if (index < 0 || index >= this.keys.length) return;
    this.keyStates[index] = Math.max(this.keyStates[index], amount);
  }

  update(dt) {
    for (let i = 0; i < this.keys.length; i++) {
      const k = this.keys[i];
      const target = this.keyStates[i];
      const current = (k.userData.baseY - k.position.y) / 0.012;
      const next = THREE.MathUtils.damp(current, target, 12, dt);
      k.position.y = k.userData.baseY - next * 0.012;
      this.keyStates[i] = THREE.MathUtils.damp(target, 0, 4, dt);
    }
  }
}

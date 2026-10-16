import * as THREE from 'three';
import { Piano } from './piano.js';
import { MothSystem } from './mothSystem.js';
import { DistortionPass } from './post/distortionPass.js';
import { Sequence } from './sequence.js';

export class HeroScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050508);
    this.scene.fog = new THREE.FogExp2(0x050508, 0.045);

    this.camera = new THREE.PerspectiveCamera(
      32,
      window.innerWidth / window.innerHeight,
      0.1,
      50,
    );
    this.camera.position.set(0.4, 1.15, 2.6);
    this.camera.lookAt(0, 0.25, 0);

    this._lights();
    this.piano = new Piano();
    this.scene.add(this.piano);

    this.moths = new MothSystem(this.scene);
    this.sequence = new Sequence(15);
    this.distortion = new DistortionPass(this.renderer, this.scene, this.camera);

    this._floor();
    window.addEventListener('resize', () => this._resize());
  }

  _lights() {
    const key = new THREE.DirectionalLight(0xfff4e0, 2.4);
    key.position.set(2.2, 4.5, 1.8);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xc8d4ff, 0.55);
    fill.position.set(-3.2, 2.0, -1.4);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffd9b0, 1.1);
    rim.position.set(-0.6, 1.8, -3.2);
    this.scene.add(rim);

    const ambient = new THREE.AmbientLight(0x1a1614, 0.35);
    this.scene.add(ambient);
  }

  _floor() {
    const geo = new THREE.PlaneGeometry(20, 20);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x08070a,
      roughness: 0.9,
      metalness: 0.0,
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.64;
    this.scene.add(floor);
  }

  _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.distortion.resize(w, h);
  }

  update() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;

    const events = this.sequence.update(dt);
    for (const e of events) {
      this.piano.press(e.key, e.intensity);
      const key = this.piano.keys[e.key];
      if (key) {
        const origin = new THREE.Vector3();
        key.getWorldPosition(origin);
        this.moths.burst(origin, Math.round(2 + e.intensity * 5));
      }
    }

    this.piano.update(dt);
    this.moths.update(dt, time);

    const density = Math.min(1, this.moths.mothCount / 40);
    this.distortion.setDensity(density);
    this.distortion.setTime(time);

    this.distortion.render();
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      this.update();
    };
    loop();
  }
}

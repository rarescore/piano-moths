import * as THREE from 'three';
import { createSSSMaterial } from './SSSMaterial.js';

/**
 * A single moth: body (elongated ellipsoid) + two forewings + two hindwings.
 * Wings use stacked, mirrored UVs with a center seam so one vertex shader
 * can flap them by rotating around that seam axis.
 * Wing material: SSS + iridescent structural-color shift driven by facing angle.
 */
const WING_VS = `
uniform float uFlap;
uniform float uTime;
varying vec3 vWorldPos;
varying vec3 vWorldNrm;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;

  // Center seam runs down the middle of UV space (u = 0.5)
  float seam = step(0.5, uv.x);          // 1 on the right wing half
  float side = seam * 2.0 - 1.0;         // -1 left, +1 right

  // Flap: rotate around the seam axis (local Y), phase-offset per wing
  float phase = uTime * 14.0 + side * 0.6;
  float flap = sin(phase) * uFlap;
  float c = cos(flap), s = sin(flap);
  pos.x = pos.x * c - pos.z * s * side;
  pos.z = pos.x * s * side + pos.z * c;

  // Gentle bobbing
  pos.y += sin(uTime * 3.0 + uv.y * 6.0) * 0.02 * uFlap;

  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorldPos = world.xyz;
  vWorldNrm = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const WING_FS = `
uniform float uTime;
varying vec3 vWorldPos;
varying vec3 vWorldNrm;
varying vec2 vUv;

void main() {
  vec3 n = normalize(vWorldNrm);
  vec3 v = normalize(cameraPosition - vWorldPos);
  float facing = abs(dot(n, v));

  // Structural coloration: hue shifts with viewing angle (like real scales)
  float hue = fract(0.55 + facing * 0.35 + sin(vUv.y * 20.0 + uTime) * 0.05);
  vec3 base = vec3(
    0.5 + 0.5 * cos(6.28318 * (hue + vec3(0.0, 0.33, 0.67)))
  );

  // Warm amber highlights on scale ridges
  float ridges = pow(sin(vUv.x * 40.0) * 0.5 + 0.5, 3.0);
  base = mix(base, vec3(1.0, 0.85, 0.45), ridges * 0.5);

  // Soft alpha falloff at wing edges
  float edge = smoothstep(0.0, 0.08, min(vUv.x, 1.0 - vUv.x)) *
               smoothstep(0.0, 0.06, min(vUv.y, 1.0 - vUv.y));

  float alpha = edge * (0.75 + 0.25 * facing);
  gl_FragColor = vec4(base, alpha);
}`;

export class Moth extends THREE.Group {
  constructor() {
    super();
    this.flapSpeed = 8 + Math.random() * 10;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.drift = new THREE.Vector3(
      (Math.random() - 0.5) * 0.4,
      Math.random() * 0.15,
      (Math.random() - 0.5) * 0.4,
    );
    this.life = 1.0;
    this.maxLife = 4 + Math.random() * 3;

    this._buildBody();
    this._buildWings();
    this._buildAntennae();
  }

  _buildBody() {
    const geo = new THREE.SphereGeometry(0.035, 8, 6);
    geo.scale(1, 2.2, 0.7);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a1f18,
      roughness: 0.9,
      metalness: 0.0,
    });
    const body = new THREE.Mesh(geo, mat);
    this.add(body);
    this.body = body;
  }

  _buildWings() {
    // Forewing: elongated teardrop. UV mirrored so seam sits at u=0.5.
    const fore = this._wingGeo(0.22, 0.13, 0.9);
    const hind = this._wingGeo(0.13, 0.09, 0.7);

    const wingMat = new THREE.ShaderMaterial({
      uniforms: {
        uFlap: { value: 1.0 },
        uTime: { value: 0 },
      },
      vertexShader: WING_VS,
      fragmentShader: WING_FS,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const lw = new THREE.Mesh(fore, wingMat);
    const rw = new THREE.Mesh(fore, wingMat);
    lw.position.set(-0.01, 0.01, 0);
    rw.position.set(0.01, 0.01, 0);
    rw.rotation.y = Math.PI; // mirror

    const lh = new THREE.Mesh(hind, wingMat);
    const rh = new THREE.Mesh(hind, wingMat);
    lh.position.set(-0.008, -0.012, 0.01);
    rh.position.set(0.008, -0.012, 0.01);
    rh.rotation.y = Math.PI;

    this.add(lw, rw, lh, rh);
    this.wingMat = wingMat;
    this.wings = [lw, rw, lh, rh];
  }

  _wingGeo(length, width, taper) {
    // Build a flat wing as a triangle fan, UVs mirrored across center seam
    const pts = [];
    const uvs = [];
    const segs = 10;
    // left half
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = -length * t;
      const y = width * Math.sin(t * Math.PI) * (1.0 - t * (1 - taper));
      pts.push(x, 0, y * 0.15);
      uvs.push(0.5 - t * 0.5, t);
    }
    // right half (mirrored)
    for (let i = segs; i >= 0; i--) {
      const t = i / segs;
      const x = length * t;
      const y = width * Math.sin(t * Math.PI) * (1.0 - t * (1 - taper));
      pts.push(x, 0, y * 0.15);
      uvs.push(0.5 + t * 0.5, t);
    }
    const verts = [];
    const uvArr = [];
    // fan from center point
    const cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < pts.length - 3; i += 3) {
      verts.push(cx, cy, cz, pts[i], pts[i + 1], pts[i + 2], pts[i + 3], pts[i + 4], pts[i + 5]);
      uvArr.push(0.5, 0, uvs[i / 3 * 2], uvs[i / 3 * 2 + 1], uvs[(i / 3 + 1) * 2], uvs[(i / 3 + 1) * 2 + 1]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr, 2));
    geo.computeVertexNormals();
    return geo;
  }

  _buildAntennae() {
    const mat = new THREE.LineBasicMaterial({ color: 0x1a120c });
    const pts = [new THREE.Vector3(0, 0.04, 0.02), new THREE.Vector3(-0.03, 0.09, 0.04), new THREE.Vector3(-0.05, 0.13, 0.03)];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    this.add(new THREE.Line(geo, mat));
    const pts2 = [new THREE.Vector3(0, 0.04, 0.02), new THREE.Vector3(0.03, 0.09, 0.04), new THREE.Vector3(0.05, 0.13, 0.03)];
    const geo2 = new THREE.BufferGeometry().setFromPoints(pts2);
    this.add(new THREE.Line(geo2, mat));
  }

  update(dt, time) {
    this.life -= dt / this.maxLife;
    this.wingMat.uniforms.uTime.value = time;
    this.wingMat.uniforms.uFlap.value = Math.max(0.2, this.life) * (0.6 + 0.4 * Math.sin(time * this.flapSpeed));

    this.position.x += this.drift.x * dt;
    this.position.y += (this.drift.y + Math.sin(time * 2.0 + this.bobPhase) * 0.08) * dt;
    this.position.z += this.drift.z * dt;

    // fade out near end of life
    const fade = Math.min(1.0, this.life * 3.0);
    this.traverse((o) => {
      if (o.material) {
        if (o.material.opacity !== undefined) o.material.opacity = fade;
        if (o.material.uniforms && o.material.uniforms.uFlap) {
          // handled above
        }
      }
    });
  }

  get alive() { return this.life > 0; }
}

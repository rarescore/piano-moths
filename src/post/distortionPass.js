import * as THREE from 'three';

export class DistortionPass {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.target = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      { samples: 2 },
    );

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uDensity: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform float uDensity;
        uniform float uTime;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;
          float warp = uDensity * 0.018;
          float n = hash(uv * 3.0 + uTime * 0.2);
          uv.x += sin(uv.y * 12.0 + uTime * 1.4) * warp;
          uv.y += sin(uv.x * 9.0 - uTime * 1.1) * warp * 0.6;
          uv += (n - 0.5) * warp * 0.4;

          float ca = uDensity * 0.004;
          float r = texture2D(tDiffuse, uv + vec2(ca, 0.0)).r;
          float g = texture2D(tDiffuse, uv).g;
          float b = texture2D(tDiffuse, uv - vec2(ca, 0.0)).b;

          vec3 col = vec3(r, g, b);
          float vig = smoothstep(0.85, 0.35, length(uv - 0.5) * (1.0 + uDensity * 0.4));
          col *= vig;
          col += vec3(0.04, 0.015, 0.0) * uDensity;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    this.sceneQuad = new THREE.Scene();
    this.cameraQuad = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.sceneQuad.add(quad);
  }

  resize(w, h) {
    this.target.setSize(w, h);
  }

  setDensity(d) {
    this.material.uniforms.uDensity.value = d;
  }

  setTime(t) {
    this.material.uniforms.uTime.value = t;
  }

  render() {
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(this.scene, this.camera);
    this.material.uniforms.tDiffuse.value = this.target.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.sceneQuad, this.cameraQuad);
  }
}

import * as THREE from 'three';

export function createWingMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFlap: { value: 1 },
      uLife: { value: 1 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uFlap;
      varying vec3 vWorldPos;
      varying vec3 vWorldNrm;
      varying vec2 vUv;
      varying float vSeam;

      void main() {
        vUv = uv;
        vec3 pos = position;

        float seam = step(0.5, uv.x);
        float side = seam * 2.0 - 1.0;
        vSeam = side;

        float phase = uTime * 16.0 + side * 0.7;
        float flap = sin(phase) * uFlap * 0.55;
        float c = cos(flap);
        float s = sin(flap);
        float nx = pos.x * c - pos.z * s * side;
        float nz = pos.x * s * side + pos.z * c;
        pos.x = nx;
        pos.z = nz;

        pos.y += sin(uTime * 4.0 + uv.y * 8.0) * 0.012 * uFlap;

        vec4 world = modelMatrix * vec4(pos, 1.0);
        vWorldPos = world.xyz;
        vWorldNrm = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uLife;
      varying vec3 vWorldPos;
      varying vec3 vWorldNrm;
      varying vec2 vUv;
      varying float vSeam;

      void main() {
        vec3 n = normalize(vWorldNrm);
        vec3 v = normalize(cameraPosition - vWorldPos);
        float facing = abs(dot(n, v));

        float hue = fract(0.58 + facing * 0.32 + sin(vUv.y * 28.0 + uTime * 0.4) * 0.04);
        vec3 base = vec3(
          0.5 + 0.5 * cos(6.28318 * (hue + vec3(0.0, 0.33, 0.67)))
        );

        float ridges = pow(abs(sin(vUv.x * 90.0)), 12.0);
        float crossRidges = pow(abs(sin(vUv.y * 40.0)), 8.0);
        float scale = ridges * (0.6 + 0.4 * crossRidges);
        base = mix(base, vec3(1.0, 0.92, 0.6), scale * 0.65);

        vec3 lightDir = normalize(vec3(0.35, 0.85, 0.25));
        float wrap = pow(saturate(dot(v, -lightDir) * 0.5 + 0.5), 1.6);
        float thickness = 1.0 - facing;
        vec3 sss = vec3(1.0, 0.55, 0.75) * wrap * thickness * 0.45;
        base += sss;

        float edge = smoothstep(0.0, 0.07, min(vUv.x, 1.0 - vUv.x))
                   * smoothstep(0.0, 0.05, min(vUv.y, 1.0 - vUv.y));

        float alpha = edge * (0.72 + 0.28 * facing) * uLife;
        gl_FragColor = vec4(base, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

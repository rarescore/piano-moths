import * as THREE from 'three';

/**
 * Cheap subsurface scattering for thin translucent geometry (moth wings).
 * Based on the Barre-Brisebois approach: a thickness-driven wrap term
 * added to a MeshPhysicalMaterial lighting model.
 *
 * Uniforms:
 *   uThicknessPower  - how sharply translucency falls off with thickness
 *   uThicknessScale  - overall strength of the SSS term
 *   uDistortion      - how much the light direction bends through the surface
 *   uAmbient         - ambient bleed color
 *   uAttenuation     - color absorbed as light passes through
 */
export function createSSSMaterial(options = {}) {
  const {
    color = 0xf2e6d0,
    thicknessColor = 0xe8a0c8,
    uThicknessPower = 2.0,
    uThicknessScale = 1.0,
    uDistortion = 0.1,
    uAmbient = 0.35,
    uAttenuation = 0.6,
  } = options;

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0.55,
    metalness: 0.0,
    clearcoat: 0.15,
    clearcoatRoughness: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uThicknessPower = { value: uThicknessPower };
    shader.uniforms.uThicknessScale = { value: uThicknessScale };
    shader.uniforms.uDistortion = { value: uDistortion };
    shader.uniforms.uAmbient = { value: uAmbient };
    shader.uniforms.uAttenuation = { value: uAttenuation };
    shader.uniforms.uThicknessColor = { value: new THREE.Color(thicknessColor) };

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec3 vViewPosition;
      `,
    ).replace(
      '#include <project_vertex>',
      `#include <project_vertex>
      vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vViewPosition = -mvPosition.xyz;
      `,
    ).replace(
      '#include <fog_vertex>',
      `#include <fog_vertex>
      // thickness approximated from facing ratio (thin = more translucent)
      float facing = abs(dot(normalize(vViewPosition), vWorldNormal));
      vColor = vec3(1.0 - facing);
      `,
    ).replace(
      'varying vec3 vColor;',
      'varying vec3 vColor; // repurposed: stores 1 - facing ratio as thickness proxy'
    ).replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      // --- subsurface scattering term ---
      float thickness = pow(vColor.r, uThicknessPower);
      vec3 lightDir = normalize(vec3(0.4, 0.9, 0.2));
      vec3 distortedLight = normalize(lightDir + vWorldNormal * uDistortion);
      float sss = pow(saturate(dot(vViewPosition, -distortedLight)), 2.0);
      vec3 sssColor = uThicknessColor * sss * thickness * uThicknessScale;
      vec3 ambientBleed = uThicknessColor * uAmbient * thickness;
      vec3 absorbed = diffuseColor.rgb * mix(vec3(1.0), uThicknessColor, uAttenuation * thickness);
      diffuseColor.rgb = absorbed + sssColor + ambientBleed;
      `,
    );
  };

  return material;
}

function saturate(x) { return clamp(x, 0.0, 1.0); }

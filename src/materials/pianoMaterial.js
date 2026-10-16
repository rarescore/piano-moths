import * as THREE from 'three';

export function createPianoBodyMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x0c0a09,
    roughness: 0.22,
    metalness: 0.08,
    clearcoat: 0.85,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.2,
  });
}

export function createKeyWhiteMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xf4f0e8,
    roughness: 0.35,
    metalness: 0.0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
  });
}

export function createKeyBlackMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    roughness: 0.25,
    metalness: 0.15,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
  });
}

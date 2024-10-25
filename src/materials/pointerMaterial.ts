// const selectedMaterial = new BABYLON.StandardMaterial("selectedMaterial", scene);
// selectedMaterial.diffuseColor = BABYLON.Color3.Blue();

import { Color3, GlowLayer, StandardMaterial } from "@babylonjs/core";

export function getPointerMaterial(name: string, scene: any) {
  const shapeMaterial = new StandardMaterial(name, scene);
  shapeMaterial.alpha = 1.0;
  shapeMaterial.diffuseColor = Color3.Red();
  shapeMaterial.backFaceCulling = false;
  return shapeMaterial;
}

export function getSelectedMaterial(name: string, scene: any) {
  const gl = new GlowLayer(name, scene);
  gl.intensity = 0.5;
  return gl;
}

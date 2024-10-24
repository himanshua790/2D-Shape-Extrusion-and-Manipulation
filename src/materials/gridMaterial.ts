import { Color3 } from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials/Grid";

export const getGridMaterial = function (name: string, scene: any) {
  const gridMaterial = new GridMaterial("groundMaterial", scene);
  gridMaterial.majorUnitFrequency = 1;
  gridMaterial.minorUnitVisibility = 0;
  gridMaterial.gridRatio = 0.5;
  gridMaterial.backFaceCulling = false;
  gridMaterial.mainColor = Color3.Black();
  gridMaterial.lineColor = Color3.Green();
  gridMaterial.opacity = 0.8;
  return gridMaterial;
};

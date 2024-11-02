import Earcut from "earcut";
import * as BABYLON from "@babylonjs/core";
import useBabylonState from "../state/GlobalState";

export function extrudeShape() {
  const scene = useBabylonState.getState().getScene();
  const shapesToExtrude = useBabylonState.getState().getShapeToExtrude();
  const shapesExtruded = useBabylonState.getState().getShapesExtruded();
  const extrudeHeight = useBabylonState.getState().extrudeLength;

  if (!scene) return;

  for (let i = 0; i < shapesToExtrude.length; i++) {
    // Initialize the extruded state for each shape if it hasn't been already
    if (i === shapesExtruded.length) {
      shapesExtruded.push(false);
    }

    // Extrude shape if it hasn't been extruded yet
    if (!shapesExtruded[i]) {
      const extrudedShapeUniqueId = "shapeExtruded" + i.toString();

      // Injecting Earcut algorithm
      (window as any).earcut = Earcut;

      // Extrude the shape upwards by using a negative depth
      const extrusion = BABYLON.MeshBuilder.ExtrudePolygon(
        extrudedShapeUniqueId,
        { shape: shapesToExtrude[i], depth: extrudeHeight, updatable: true },
        scene
      );

      // Set the position of the extrusion to start at ground level
      extrusion.position.y = extrudeHeight;
      // Update vertex positions and normals
      extrusion.bakeCurrentTransformIntoVertices();
      extrusion.position = BABYLON.Vector3.Zero();

      // Extruded shape UI Enhancements
      const material = new BABYLON.StandardMaterial("extrudedMaterial", scene);
      material.emissiveColor = new BABYLON.Color3(0, 0.5, 0.5);
      material.backFaceCulling = false;
      extrusion.material = material;
      extrusion.isPickable = true;

      // Mark shape as extruded
      shapesExtruded[i] = true;
    }
  }

  // Update shapesExtruded in Zustand state after all extrusions
  useBabylonState.getState().setMarkAsExtruded(shapesExtruded);
}

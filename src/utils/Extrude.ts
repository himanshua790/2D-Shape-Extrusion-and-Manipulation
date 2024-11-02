import Earcut from "earcut";
import * as BABYLON from "@babylonjs/core";
import useBabylonState from "../state/GlobalState";

export function extrudeShape() {
  const scene = useBabylonState.getState().getScene();
  const shapesToExtrude = useBabylonState.getState().getShapeToExtrude();
  const shapesExtruded = useBabylonState.getState().getShapesExtruded();

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
      // Extrude the shape with a constant height of 5
      const extrusion = BABYLON.MeshBuilder.ExtrudePolygon(
        extrudedShapeUniqueId,
        { shape: shapesToExtrude[i], depth: 3, updatable: true },
        scene
      );
      extrusion.position.y = 3;

      // Update vertex positions and normals
      const positions = extrusion.getVerticesData(
        BABYLON.VertexBuffer.PositionKind
      ) as BABYLON.FloatArray;
      extrusion.setVerticesData(
        BABYLON.VertexBuffer.PositionKind,
        positions,
        true
      );
      const normals = extrusion.getVerticesData(
        BABYLON.VertexBuffer.NormalKind
      ) as BABYLON.FloatArray;
      extrusion.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals, true);

      // Extruded shape UI Enhancements
      const material = new BABYLON.StandardMaterial("extrudedMaterial", scene);
      material.emissiveColor = new BABYLON.Color3(0, 128, 128);
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

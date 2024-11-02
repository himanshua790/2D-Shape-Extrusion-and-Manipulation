// components/VertexEdit.ts
import {
  Mesh,
  MeshBuilder,
  PointerDragBehavior,
  StandardMaterial,
  Color3,
  Vector3,
  Scene,
  VertexBuffer,
} from "@babylonjs/core";
import useBabylonState from "../state/GlobalState";

export function enterVertexEditMode(mesh: Mesh, scene: Scene) {
  const vertexMarkers: Mesh[] = [];
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

  if (!positions) return;

  // Create a sphere marker for each vertex
  for (let i = 0; i < positions.length; i += 3) {
    const vertexPosition = new Vector3(
      positions[i],
      positions[i + 1],
      positions[i + 2]
    );

    const marker = MeshBuilder.CreateSphere(
      `vertexMarker_${i / 3}`,
      { diameter: 0.1 },
      scene
    );
    marker.position = vertexPosition.clone();
    const material = new StandardMaterial(
      "vertexMarkerMat",
      scene
    ) as StandardMaterial;
    material.diffuseColor = new Color3(1, 0, 0);
    marker.material = material;
    marker.isPickable = true;

    // Add drag behavior
    const dragBehavior = new PointerDragBehavior({
      dragPlaneNormal: new Vector3(0, 1, 0),
    });
    dragBehavior.moveAttached = false; // We'll handle movement manually
    marker.addBehavior(dragBehavior);

    dragBehavior.onDragObservable.add((event) => {
      const newPosition = event.dragPlanePoint;
      //   updateVertexPosition(mesh, i, newPosition, scene);
      updateVertexPosition(mesh, i, newPosition);
      marker.position.copyFrom(newPosition);
    });

    vertexMarkers.push(marker);
  }

  // Store markers in state for cleanup later
  useBabylonState.getState().setVertexMarkers(vertexMarkers);
}

function updateVertexPosition(
  mesh: Mesh,
  index: number,
  newPosition: Vector3
  //   scene: Scene
) {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

  if (!positions) return;

  positions[index] = newPosition.x;
  positions[index + 1] = newPosition.y;
  positions[index + 2] = newPosition.z;

  mesh.updateVerticesData(VertexBuffer.PositionKind, positions);
  mesh.refreshBoundingInfo();
}

export function exitVertexEditMode() {
  const vertexMarkers = useBabylonState.getState().getVertexMarkers();
  vertexMarkers.forEach((marker) => marker.dispose());
  useBabylonState.getState().setVertexMarkers([]);
}

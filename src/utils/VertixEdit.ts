// Assume scene and engine are already created

import {
  Color3,
  MeshBuilder,
  PointerDragBehavior,
  StandardMaterial,
  Vector3,
  VertexBuffer,
  type Mesh,
} from "@babylonjs/core";
import useBabylonState from "../state/GlobalState";

// ... (Create ground plane and initial meshes)

// Variables to keep track of state
var vertexSpheres = [];

// Function to enter vertex edit mode
export function enterVertexEditMode(mesh: Mesh) {
  useBabylonState.getState().setMode("edit");
  showVertices(mesh);
}

// Function to show vertices
function showVertices(mesh: Mesh) {
  const scene = mesh.getScene();
  var positions = mesh.getVerticesData(
    VertexBuffer.PositionKind
  ) as Float32Array;

  for (let i = 0; i < positions.length; i += 3) {
    let x = positions[i];
    let y = positions[i + 1];
    let z = positions[i + 2];

    let sphere = MeshBuilder.CreateSphere(
      "vertexSphere",
      { diameter: 0.1 },
      scene
    );
    sphere.position = new Vector3(x, y, z);
    const sphereMaterial = new StandardMaterial("vertexMat", scene);
    sphereMaterial.diffuseColor = Color3.Green();
    sphere.material = sphereMaterial;
    sphere.isPickable = true;

    var dragBehavior = new PointerDragBehavior({
      dragPlaneNormal: new Vector3(0, 1, 0),
    });
    dragBehavior.useObjectOrientationForDragging = false;
    sphere.addBehavior(dragBehavior);

    dragBehavior.onDragObservable.add((event) => {
      updateVertexPosition(mesh, sphere, event.dragPlanePoint);
    });

    vertexSpheres.push(sphere);
  }
}

// Function to update vertex positions
function updateVertexPosition(mesh: Mesh, sphere: Mesh, newPosition: Vector3) {
  var positions = mesh.getVerticesData(
    VertexBuffer.PositionKind
  ) as Float32Array;

  for (let i = 0; i < positions.length; i += 3) {
    let vertexPos = new Vector3(
      positions[i],
      positions[i + 1],
      positions[i + 2]
    );

    if (vertexPos.equalsWithEpsilon(sphere.position, 0.1)) {
      positions[i] = newPosition.x;
      positions[i + 1] = newPosition.y;
      positions[i + 2] = newPosition.z;

      sphere.position = newPosition;

      break;
    }
  }

  mesh.updateVerticesData(VertexBuffer.PositionKind, positions);
}

// components/VertexEdit.ts

import {
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Scene,
  VertexBuffer,
  TransformNode,
  GizmoManager,
  PickingInfo,
} from "@babylonjs/core";
import useBabylonState from "../state/GlobalState";

/**
 * Array to store the positions of the currently selected vertices.
 */
let selectedVertices: Vector3[] = [];

/**
 * The mesh currently being edited.
 */
let selectedMesh: Mesh | null = null;

/**
 * Array to store the marker meshes that visually represent selected vertices.
 */
let vertexMarkers: Mesh[] = [];

/**
 * GizmoManager instance to handle gizmo creation and manipulation.
 */
let gizmoManager: GizmoManager;

/**
 * TransformNode to which the gizmo will be attached for vertex manipulation.
 */
let transformNode: TransformNode;

/**
 * Origin point used during vertex manipulation to calculate deltas.
 */
let pickOrigin: Vector3;

/**
 * Radius within which vertices will be selected around the picked point.
 * Adjust this value based on the scale of your scene and desired selection sensitivity.
 */
let radius = 0.5; // Adjust as needed

/**
 * Enters vertex edit mode for a given mesh.
 * Sets up the gizmo, initializes necessary variables, and prepares for vertex selection.
 * @param mesh - The mesh to enter edit mode on.
 * @param scene - The Babylon.js scene.
 */
export function enterVertexEditMode(mesh: Mesh, scene: Scene) {
  selectedMesh = mesh;
  pickOrigin = new Vector3();
  vertexMarkers = [];
  selectedVertices = [];

  // Dispatch an event to update UI instructions for the user.
  window.dispatchEvent(
    new CustomEvent("updateInstructions", {
      detail: "Use Right Click to select Vertices to Move",
    })
  );

  // Retrieve the vertex positions from the mesh.
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  if (!positions) return; // Exit if no vertex data is found.

  // Initialize a TransformNode to attach the gizmo.
  transformNode = new TransformNode("transformNode", scene);
  // transformNode.isPickable = false; // Prevent the gizmo from being pickable.

  // Initialize GizmoManager and configure it.
  gizmoManager = new GizmoManager(scene);
  gizmoManager.positionGizmoEnabled = true; // Enable position gizmo.
  gizmoManager.rotationGizmoEnabled = false; // Disable rotation gizmo.
  gizmoManager.scaleGizmoEnabled = false; // Disable scale gizmo.
  gizmoManager.boundingBoxGizmoEnabled = false; // Disable bounding box gizmo.

  // Prevent the gizmo from automatically attaching to any picked mesh.
  gizmoManager.usePointerToAttachGizmos = false;

  // Restrict the gizmo to only attach to the TransformNode.
  // Note: If TransformNode is not a Mesh, consider using `attachableNodes` instead.
  gizmoManager.attachableNodes = [transformNode];

  // Extract and store vertex positions as Vector3 objects.
  const vertices: Vector3[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    vertices.push(
      new Vector3(positions[i], positions[i + 1], positions[i + 2])
    );
  }
  useBabylonState.getState().setMeshVertices(vertices);

  // Add event listeners for pointer interactions.
  addVertexEditEventListeners(scene);
}

/**
 * Adds event listeners for pointer movements and clicks during vertex edit mode.
 * @param scene - The Babylon.js scene.
 */
function addVertexEditEventListeners(scene: Scene) {
  const canvas = scene.getEngine().getRenderingCanvas();

  /**
   * Handles pointer move events to highlight vertex markers within the selection radius.
   */
  const onPointerMove = () => {
    const pickResult = scene.pick(scene.pointerX, scene.pointerY);

    // Reset all marker colors to default (red).
    vertexMarkers.forEach((marker) => {
      (marker.material as StandardMaterial).diffuseColor = new Color3(1, 0, 0);
    });

    if (pickResult?.hit) {
      const pickPoint = pickResult.pickedPoint;
      if (pickPoint) {
        // Highlight markers within the specified radius by changing their color to green.
        vertexMarkers.forEach((marker) => {
          if (Vector3.Distance(marker.position, pickPoint) <= radius) {
            (marker.material as StandardMaterial).diffuseColor = new Color3(
              0,
              1,
              0
            );
          }
        });
      }
    }
  };

  /**
   * Handles pointer down events to select vertices on right-click or detach gizmo on left-click.
   * @param evt - The pointer event.
   */
  const onPointerDown = (evt: PointerEvent) => {
    if (evt.button === 2) {
      // Right-click detected.
      evt.preventDefault(); // Prevent the context menu from appearing.

      const pickResult = scene.pick(scene.pointerX, scene.pointerY);
      if (
        pickResult?.hit &&
        selectedMesh?.name &&
        pickResult?.pickedMesh?.name?.includes(selectedMesh?.name)
      ) {
        // Dispatch an event to update UI instructions.
        window.dispatchEvent(
          new CustomEvent("updateInstructions", {
            detail: "Use Gizmo to move vertex",
          })
        );

        // Select vertices within the specified radius.
        selectVertices(pickResult);
      }
    } else {
      // Left-click detected.
      // Detach the gizmo by disposing the TransformNode.
      transformNode.dispose();

      // Dispatch an event to revert UI instructions.
      window.dispatchEvent(
        new CustomEvent("updateInstructions", {
          detail: "Use Right Click to select Vertices to Move",
        })
      );
    }
  };

  // Attach the event listeners to the canvas.
  canvas?.addEventListener("pointermove", onPointerMove);
  canvas?.addEventListener("pointerdown", onPointerDown);

  // Store the event handlers in the global state for later cleanup.
  useBabylonState.getState().setVertexEditModeHandlers({
    onPointerMove,
    onPointerDown,
  });
}

/**
 * Selects vertices within the specified radius from the picked point.
 * Creates visual markers for selected vertices and attaches a gizmo for manipulation.
 * @param pickResult - The picking information from the raycast.
 */
function selectVertices(pickResult: PickingInfo) {
  // Dispose of any existing vertex markers to avoid duplicates.
  vertexMarkers.forEach((marker) => marker.dispose());
  vertexMarkers = [];
  selectedVertices = [];

  const mesh = selectedMesh;
  if (!mesh) return;

  // Retrieve stored vertex positions from the global state.
  const positions = useBabylonState.getState().getMeshVertices();
  if (!positions) return;

  const worldMatrix = mesh.getWorldMatrix();

  const pickPoint = pickResult.pickedPoint;
  if (!pickPoint) return;

  // Set the pickOrigin to the point where the user right-clicked.
  pickOrigin.copyFrom(pickPoint);

  // Iterate through all vertices to find those within the selection radius.
  for (let i = 0; i < positions.length; i++) {
    const vertex = positions[i];
    const worldPosition = Vector3.TransformCoordinates(vertex, worldMatrix);
    const distance = Vector3.Distance(worldPosition, pickPoint);

    if (distance < radius) {
      selectedVertices.push(vertex);

      // Create a visual marker (sphere) at the vertex position.
      const marker = MeshBuilder.CreateSphere(
        `vertexMarker_${i}`,
        { diameter: 0.25 },
        mesh.getScene()
      );
      marker.position.copyFrom(worldPosition);
      marker.renderingGroupId = 1; // Ensure markers render on top of other meshes.

      // Assign a blue material to indicate selection.
      const material = new StandardMaterial(
        `vertexMarkerMat_${i}`,
        mesh.getScene()
      );
      material.diffuseColor = new Color3(0, 0, 1); // Blue color.
      marker.material = material;
      marker.isPickable = false; // Prevent markers from being pickable.

      vertexMarkers.push(marker);
    }
  }

  // Clear any existing drag observers to prevent multiple subscriptions.
  gizmoManager.gizmos.positionGizmo?.onDragObservable.clear();

  if (!vertexMarkers.length) {
    // If no vertices are selected, detach the gizmo.
    gizmoManager.attachToMesh(null);
    return;
  }

  // Position the TransformNode at the picked point.
  transformNode.position.copyFrom(pickPoint);

  // Attach the gizmo to the TransformNode for vertex manipulation.
  gizmoManager.attachToNode(transformNode);

  // Add drag behavior to the gizmo.
  gizmoManager.gizmos.positionGizmo?.onDragObservable.add(() => {
    // Calculate the delta movement based on the TransformNode's new position.
    const delta = transformNode.position.subtract(pickOrigin);

    // Move each selected vertex and its corresponding marker by the delta.
    for (let i = 0; i < selectedVertices.length; i++) {
      selectedVertices[i].addInPlace(delta);
      vertexMarkers[i].position.addInPlace(delta);
    }

    // Update the pickOrigin for the next drag event.
    pickOrigin.addInPlace(delta);

    // Update the mesh's vertex data with the new positions.
    updateVertices(mesh);
  });
}

/**
 * Updates the mesh's vertex positions based on the selected vertices' new positions.
 * @param mesh - The mesh to update.
 */
function updateVertices(mesh: Mesh) {
  // Retrieve the updated vertex positions from the global state.
  const vertices = useBabylonState.getState().getMeshVertices();
  const positions: number[] = [];

  // Flatten the Vector3 positions into a numeric array.
  for (let i = 0; i < vertices.length; i++) {
    positions.push(vertices[i].x, vertices[i].y, vertices[i].z);
  }

  // Update the mesh's vertex buffer with the new positions.
  mesh.updateVerticesData(VertexBuffer.PositionKind, positions, true);
  mesh.refreshBoundingInfo(); // Refresh the mesh's bounding info to account for the new vertex positions.
}

/**
 * Exits vertex edit mode by cleaning up markers, gizmo, and event listeners.
 */
export function exitVertexEditMode() {
  // Dispose of all vertex markers.
  vertexMarkers.forEach((marker) => marker.dispose());
  vertexMarkers = [];
  selectedVertices = [];
  selectedMesh = null;

  // Dispose of the GizmoManager and TransformNode to clean up resources.
  gizmoManager?.dispose();
  transformNode?.dispose();

  // Retrieve the current scene and canvas from the global state.
  const scene = useBabylonState.getState().getScene();
  const canvas = scene?.getEngine().getRenderingCanvas();
  const handlers = useBabylonState.getState().getVertexEditModeHandlers();

  if (handlers) {
    // Remove the event listeners to prevent memory leaks.
    canvas?.removeEventListener("pointermove", handlers.onPointerMove);
    canvas?.removeEventListener("pointerdown", handlers.onPointerDown);

    // Clear the handlers from the global state.
    useBabylonState.getState().setVertexEditModeHandlers(null);
  }

  // Restore the mesh's pickability for future interactions.
  if (selectedMesh) {
    selectedMesh.isPickable = true;
  }
}

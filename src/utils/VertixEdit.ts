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

let selectedVertices: Vector3[] = [];
let selectedMesh: Mesh | null = null;
let vertexMarkers: Mesh[] = [];
let gizmoManager: GizmoManager;
let transformNode: TransformNode;
let pickOrigin: Vector3;
let radius = 0.5; // Adjust as needed

export function enterVertexEditMode(mesh: Mesh, scene: Scene) {
  selectedMesh = mesh;
  pickOrigin = new Vector3();
  vertexMarkers = [];
  selectedVertices = [];

  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

  if (!positions) return;

  // Initialize TransformNode
  transformNode = new TransformNode("transformNode", scene);

  // Initialize GizmoManager and set it up
  gizmoManager = new GizmoManager(scene);
  gizmoManager.positionGizmoEnabled = true;
  gizmoManager.rotationGizmoEnabled = false;
  gizmoManager.scaleGizmoEnabled = false;
  gizmoManager.boundingBoxGizmoEnabled = false;

  // Prevent auto-attaching the gizmo to picked meshes
  gizmoManager.usePointerToAttachGizmos = false;

  // Only allow the gizmo to attach to the transformNode
  gizmoManager.attachableMeshes = [transformNode];

  // Store mesh and its vertices
  const vertices = [];
  for (let i = 0; i < positions.length; i += 3) {
    vertices.push(
      new Vector3(positions[i], positions[i + 1], positions[i + 2])
    );
  }
  useBabylonState.getState().setMeshVertices(vertices);

  // Add event listeners
  addVertexEditEventListeners(scene);
}

function addVertexEditEventListeners(scene: Scene) {
  const canvas = scene.getEngine().getRenderingCanvas();

  const onPointerMove = () => {
    const pickResult = scene.pick(scene.pointerX, scene.pointerY);

    // Clear previous highlights
    vertexMarkers.forEach((marker) => {
      (marker.material as StandardMaterial).diffuseColor = new Color3(1, 0, 0); // Default color
    });

    if (pickResult?.hit) {
      const pickPoint = pickResult.pickedPoint;
      if (pickPoint) {
        // Highlight markers within radius
        vertexMarkers.forEach((marker) => {
          if (Vector3.Distance(marker.position, pickPoint) <= radius) {
            (marker.material as StandardMaterial).diffuseColor = new Color3(
              0,
              1,
              0
            ); // Highlight color
          }
        });
      }
    }
  };

  const onPointerDown = (evt: PointerEvent) => {
    if (evt.button === 2) {
      // Right-click
      evt.preventDefault(); // Prevent context menu

      const pickResult = scene.pick(scene.pointerX, scene.pointerY);
      if (
        pickResult?.hit &&
        selectedMesh?.name &&
        pickResult?.pickedMesh?.name?.includes(selectedMesh?.name)
      ) {
        selectVertices(pickResult);
      }
    } else {
      transformNode.dispose();
    }
  };

  canvas?.addEventListener("pointermove", onPointerMove);
  canvas?.addEventListener("pointerdown", onPointerDown);

  // Store handlers for cleanup
  useBabylonState.getState().setVertexEditModeHandlers({
    onPointerMove,
    onPointerDown,
  });
}

function selectVertices(pickResult: PickingInfo) {
  // Dispose of previous markers
  vertexMarkers.forEach((marker) => marker.dispose());
  vertexMarkers = [];
  selectedVertices = [];

  const mesh = selectedMesh;
  if (!mesh) return;

  const positions = useBabylonState.getState().getMeshVertices();
  if (!positions) return;

  const worldMatrix = mesh.getWorldMatrix();

  const pickPoint = pickResult.pickedPoint;
  if (!pickPoint) return;

  pickOrigin.copyFrom(pickPoint);

  // Find vertices within radius
  for (let i = 0; i < positions.length; i++) {
    const vertex = positions[i];
    const worldPosition = Vector3.TransformCoordinates(vertex, worldMatrix);
    const distance = Vector3.Distance(worldPosition, pickPoint);

    if (distance < radius) {
      selectedVertices.push(vertex);

      // Create marker
      const marker = MeshBuilder.CreateSphere(
        `vertexMarker_${i}`,
        { diameter: 0.25 },
        mesh.getScene()
      );
      marker.position.copyFrom(worldPosition);
      marker.renderingGroupId = 1; // Render on top
      const material = new StandardMaterial(
        `vertexMarkerMat_${i}`,
        mesh.getScene()
      );
      material.diffuseColor = new Color3(0, 0, 1); // Selected color
      marker.material = material;
      marker.isPickable = false;

      vertexMarkers.push(marker);
    }
  }

  // Clear previous drag observers
  gizmoManager.gizmos.positionGizmo?.onDragObservable.clear();
  
  if (!vertexMarkers.length) {
    gizmoManager.attachToMesh(null);
    return;
  }

  // Set up gizmo
  transformNode.position.copyFrom(pickPoint);
  gizmoManager.attachToMesh(transformNode);

  // Add drag behavior
  gizmoManager.gizmos.positionGizmo?.onDragObservable.add(() => {
    const delta = transformNode.position.subtract(pickOrigin);

    for (let i = 0; i < selectedVertices.length; i++) {
      selectedVertices[i].addInPlace(delta);
      vertexMarkers[i].position.addInPlace(delta);
    }

    pickOrigin.addInPlace(delta);
    updateVertices(mesh);
  });
}

function updateVertices(mesh: Mesh) {
  const vertices = useBabylonState.getState().getMeshVertices();
  const positions: number[] = [];

  for (let i = 0; i < vertices.length; i++) {
    positions.push(vertices[i].x, vertices[i].y, vertices[i].z);
  }

  mesh.updateVerticesData(VertexBuffer.PositionKind, positions);
  mesh.refreshBoundingInfo();
}

export function exitVertexEditMode() {
  vertexMarkers.forEach((marker) => marker.dispose());
  vertexMarkers = [];
  selectedVertices = [];
  selectedMesh = null;

  gizmoManager?.dispose();
  transformNode?.dispose();

  const scene = useBabylonState.getState().getScene();
  const canvas = scene?.getEngine().getRenderingCanvas();
  const handlers = useBabylonState.getState().getVertexEditModeHandlers();

  if (handlers) {
    canvas?.removeEventListener("pointermove", handlers.onPointerMove);
    canvas?.removeEventListener("pointerdown", handlers.onPointerDown);
    useBabylonState.getState().setVertexEditModeHandlers(null);
  }
}

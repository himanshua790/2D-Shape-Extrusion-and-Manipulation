import {
  GizmoManager,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  Vector3,
  VertexBuffer,
} from "@babylonjs/core";
import { getPointerMaterial } from "../materials/pointerMaterial";

export function createVertexMarkersAndLines(mesh: Mesh, scene: Scene) {
  const vertices = mesh.getVerticesData(VertexBuffer.PositionKind) as number[];
  const cornerGroups: Map<string, number[]> = new Map();
  const vertexMarkers: Mesh[] = [];
  const markerInstances: Vector3[] = []; // Store references for updates

  // Group vertices by similar positions
  for (let i = 0; i < vertices.length; i += 3) {
    const vertexPosition = new Vector3(vertices[i], vertices[i + 1] + 3, vertices[i + 2]);
    markerInstances.push(vertexPosition); // Store position reference

    const key = `${vertexPosition.x.toFixed(3)},${vertexPosition.y.toFixed(3)},${vertexPosition.z.toFixed(3)}`;
    if (!cornerGroups.has(key)) {
      cornerGroups.set(key, []);
    }
    cornerGroups.get(key)!.push(i);
  }

  // Create markers for each unique corner group
  cornerGroups.forEach((indices, key) => {
    const [x, y, z] = key.split(",").map(Number);
    const cornerPosition = new Vector3(x, y, z);

    const marker = MeshBuilder.CreateBox("vertexMarker", { size: 0.2 }, scene);
    marker.position = cornerPosition;
    marker.material = getPointerMaterial("vertexMarker", scene);
    marker.isPickable = true;
    vertexMarkers.push(marker);
  });

  return { vertexMarkers, cornerGroups, markerInstances };
}

export function attachGizmoAndHandleUpdates(
  scene: Scene,
  mainMesh: Mesh,
  vertexMarkers: Mesh[],
  cornerGroups: Map<string, number[]>,
  markerInstances: Vector3[]
) {
  const gizmoManager = new GizmoManager(scene);
  gizmoManager.positionGizmoEnabled = true;

  let initialPickOrigin = new Vector3();

  // Attach gizmo on right-click and set initial position
  scene.onPointerObservable.add((pointerInfo) => {
    const pickedMesh = pointerInfo.pickInfo?.pickedMesh;
    if (
      pointerInfo.type === PointerEventTypes.POINTERDOWN &&
      pointerInfo.event.button === 2 &&
      pickedMesh &&
      pickedMesh.id.startsWith("vertexMarker")
    ) {
      gizmoManager.attachToMesh(pickedMesh);
      initialPickOrigin.copyFrom(pickedMesh.position); // Set the initial position for delta calculation
    }
  });

  // Real-time dragging updates
  gizmoManager.gizmos.positionGizmo?.onDragObservable.add(() => {
    const pickedMesh = gizmoManager.gizmos.positionGizmo?.attachedMesh;
    if (!pickedMesh) return;

    const indices = cornerGroups.get(pickedMesh.id);
    if (!indices) return;

    // Calculate delta based on movement
    const delta = pickedMesh.position.subtract(initialPickOrigin);
    indices.forEach((idx) => {
      markerInstances[idx].addInPlace(delta); // Update stored positions

      const vertices = mainMesh.getVerticesData(VertexBuffer.PositionKind) as number[];
      vertices[idx * 3] = markerInstances[idx].x;
      vertices[idx * 3 + 1] = markerInstances[idx].y - 3; // Adjust for extrusion height
      vertices[idx * 3 + 2] = markerInstances[idx].z;
      mainMesh.updateVerticesData(VertexBuffer.PositionKind, vertices);
    });

    initialPickOrigin.copyFrom(pickedMesh.position); // Reset for next update
  });

  // Finalize updates on drag end
  gizmoManager.gizmos.positionGizmo?.onDragEndObservable.add(() => {
    const pickedMesh = gizmoManager.gizmos.positionGizmo?.attachedMesh;
    if (!pickedMesh) return;

    // Update final positions on main mesh
    const indices = cornerGroups.get(pickedMesh.id);
    if (!indices) return;

    const vertices = mainMesh.getVerticesData(VertexBuffer.PositionKind) as number[];
    indices.forEach((idx) => {
      vertices[idx * 3] = markerInstances[idx].x;
      vertices[idx * 3 + 1] = markerInstances[idx].y - 3;
      vertices[idx * 3 + 2] = markerInstances[idx].z;
    });

    mainMesh.updateVerticesData(VertexBuffer.PositionKind, vertices);
    mainMesh.bakeCurrentTransformIntoVertices();
  });

  // Detach gizmo on right-click release
  scene.onPointerObservable.add((pointerInfo) => {
    if (
      pointerInfo.type === PointerEventTypes.POINTERUP &&
      pointerInfo.event.button === 2
    ) {
      gizmoManager.attachToMesh(null);
    }
  });
}

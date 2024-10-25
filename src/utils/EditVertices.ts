import {
  AbstractMesh,
  GizmoManager,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  Vector3,
  VertexBuffer,
} from "@babylonjs/core";
import { getPointerMaterial } from "../materials/PointerMaterial";

// Extrution height
const extrusionHeight = 3;
// Array to store the created markers for vertices
const vertexMarkers: Mesh[] = [];
let selectedMeshId = "";

// Function to create vertex markers for each unique vertex position and group similar vertices
export function createVertexMarkersAndLines(mesh: AbstractMesh, scene: Scene) {
  selectedMeshId = mesh.id; // Set the selected mesh ID
  vertexMarkers.forEach((marker) => {
    marker.dispose(); // Clear existing markers
  });
  vertexMarkers.length = 0; // Reset the vertexMarkers array

  // Retrieve vertex positions from the mesh
  const vertices = mesh.getVerticesData(VertexBuffer.PositionKind) as number[];
  const cornerGroups: Map<string, number[]> = new Map(); // Map to group vertices by position
  const markerInstances: Vector3[] = []; // Store references to vertex positions for updates

  // Iterate over vertices and group by position (rounded to 3 decimal places for accuracy)
  for (let i = 0; i < vertices.length; i += 3) {
    const vertexPosition = new Vector3(
      vertices[i],
      vertices[i + 1] + extrusionHeight, // Adjust for extrusion height
      vertices[i + 2]
    );
    markerInstances.push(vertexPosition); // Store position reference

    // Key format to group vertices by approximate location
    const key = `${vertexPosition.x.toFixed(3)},${vertexPosition.y.toFixed(
      3
    )},${vertexPosition.z.toFixed(3)}`;
    if (!cornerGroups.has(key)) {
      cornerGroups.set(key, []);
    }
    cornerGroups.get(key)!.push(i); // Add vertex index to the corresponding group
  }

  // Create a marker for each unique corner group
  cornerGroups.forEach((_, key) => {
    const [x, y, z] = key.split(",").map(Number);
    const cornerPosition = new Vector3(x, y, z);

    // Create a small box to represent the vertex marker
    const marker = MeshBuilder.CreateBox("vertexMarker", { size: 0.2 }, scene);
    marker.position = cornerPosition;
    marker.material = getPointerMaterial("vertexMarker", scene);
    marker.isPickable = true; // Enable picking for interaction
    vertexMarkers.push(marker);
  });

  return { vertexMarkers, cornerGroups, markerInstances };
}

// Function to attach gizmo to selected vertices for manipulation and handle real-time updates
export function attachGizmoAndHandleUpdates(
  scene: Scene,
  mainMesh: Mesh,
  cornerGroups: Map<string, number[]>,
  markerInstances: Vector3[]
) {
  const gizmoManager = new GizmoManager(scene);
  gizmoManager.attachToMesh(null); // Disable automatic attachment

  let initialPickOrigin = new Vector3(); // Store initial position for delta calculations

  // Add a right-click listener to attach gizmo to selected vertex markers
  scene.onPointerObservable.add((pointerInfo) => {
    const pickedMesh = pointerInfo.pickInfo?.pickedMesh;
    if (
      pointerInfo.type === PointerEventTypes.POINTERDOWN &&
      pointerInfo.event.button === 2 &&
      pickedMesh &&
      pickedMesh.id.startsWith("vertexMarker")
    ) {
      gizmoManager.attachToMesh(pickedMesh);
      initialPickOrigin.copyFrom(pickedMesh.position); // Store initial position for movement calculation
    }
  });

  // Update vertex positions while dragging
  gizmoManager.gizmos.positionGizmo?.onDragObservable.add(() => {
    const pickedMesh = gizmoManager.gizmos.positionGizmo?.attachedMesh;
    if (!pickedMesh) return;

    // Get group of vertices to update based on the picked marker's ID
    const indices = cornerGroups.get(pickedMesh.id);
    if (!indices) return;

    // Calculate movement delta and update vertices accordingly
    const delta = pickedMesh.position.subtract(initialPickOrigin);
    indices.forEach((idx) => {
      markerInstances[idx].addInPlace(delta); // Update position in markerInstances

      // Update vertex data on the main mesh
      const vertices = mainMesh.getVerticesData(
        VertexBuffer.PositionKind
      ) as number[];
      vertices[idx * 3] = markerInstances[idx].x;
      vertices[idx * 3 + 1] = markerInstances[idx].y - extrusionHeight; // Adjust for extrusion height
      vertices[idx * 3 + 2] = markerInstances[idx].z;
      mainMesh.updateVerticesData(VertexBuffer.PositionKind, vertices);
    });

    // Reset initial position for next drag event
    initialPickOrigin.copyFrom(pickedMesh.position);
  });

  // Finalize vertex positions on drag end
  gizmoManager.gizmos.positionGizmo?.onDragEndObservable.add(() => {
    const pickedMesh = gizmoManager.gizmos.positionGizmo?.attachedMesh;
    if (!pickedMesh) return;

    // Update main mesh vertices with final positions
    const indices = cornerGroups.get(pickedMesh.id);
    if (!indices) return;

    const vertices = mainMesh.getVerticesData(
      VertexBuffer.PositionKind
    ) as number[];
    indices.forEach((idx) => {
      vertices[idx * 3] = markerInstances[idx].x;
      vertices[idx * 3 + 1] = markerInstances[idx].y - 3;
      vertices[idx * 3 + 2] = markerInstances[idx].z;
    });

    mainMesh.updateVerticesData(VertexBuffer.PositionKind, vertices);
    mainMesh.bakeCurrentTransformIntoVertices(); // Apply transformations permanently
  });

  // Detach the gizmo on right-click release
  scene.onPointerObservable.add((pointerInfo) => {
    if (
      pointerInfo.type === PointerEventTypes.POINTERUP &&
      pointerInfo.event.button === 2
    ) {
      gizmoManager.attachToMesh(null);
    }
  });
}

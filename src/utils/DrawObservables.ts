import {
  Color3,
  HighlightLayer,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  PointerInfo,
  PointerInput,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { getPointerMaterial } from "../materials/PointerMaterial";
import useBabylonState from "../state/GlobalState";
import {
  attachGizmoAndHandleUpdates,
  createVertexMarkersAndLines,
} from "./EditVertices";

// Main function to add observables for drawing, moving, and editing meshes
export function addButtonObservable() {
  // Retrieve the current scene from the global state
  const scene = useBabylonState.getState().getScene();
  if (!scene) return;

  let points = useBabylonState.getState().getPoints();
  let shapeToExtrude = useBabylonState.getState().getShapeToExtrude();
  let startingPoint: Vector3 | null = null;
  let currentMesh: any = null;
  let tempVertexMarkers: Mesh[] = [];
  const tempPoints: Mesh[] = [];
  const canvas = scene.getEngine().getRenderingCanvas();
  const ground = scene.getMeshByName("ground");
  const camera = scene.activeCamera;

  // Function to get the position on the ground mesh where the pointer is located
  const getGroundPosition = () => {
    const pickInfo = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => mesh === ground
    );
    return pickInfo?.hit ? pickInfo.pickedPoint : null;
  };

  // Handler for tap events on the ground mesh to create points, middle-click events, and right-click actions
  const onDrawPointerTapHandler = (pointerInfo: PointerInfo) => {
    if (!pointerInfo.pickInfo) return;

    if (
      pointerInfo.type === PointerEventTypes.POINTERTAP &&
      pointerInfo.pickInfo.hit &&
      pointerInfo.pickInfo.pickedMesh?.name === "ground"
    ) {
      switch (pointerInfo.event.inputIndex) {
        case PointerInput.LeftClick:
          createPoint(pointerInfo);
          break;
        case PointerInput.MiddleClick:
          console.log("MIDDLE");
          break;
        case PointerInput.RightClick:
          onRightClick();
          break;
      }
    }
  };

  // Creates a new point at the clicked location on the ground and adds it to the points array
  function createPoint(pointerInfo: PointerInfo) {
    const pickedPoint = pointerInfo?.pickInfo?.pickedPoint;
    if (pickedPoint) {
      const pointSphere = MeshBuilder.CreateSphere(
        "point",
        { diameter: 0.2 },
        scene
      );
      pointSphere.material = getPointerMaterial("point", scene);
      pointSphere.position = new Vector3(
        pickedPoint.x,
        pickedPoint.y + 0.01,
        pickedPoint.z
      );
      points.push(pointSphere.position);
      tempPoints.push(pointSphere);
      useBabylonState.getState().setPoints(points);

      // Dispatches a custom event to notify that a point has been created
      const event = new CustomEvent("pointCreated", {
        detail: tempPoints,
      });
      window.dispatchEvent(event);
    }
  }

  // Handles right-click actions to create a closed shape for extrusion
  function onRightClick() {
    if (points.length < 3) {
      // Notifies the user to draw at least three points before closing the shape
      const event = new CustomEvent("updateInstructions", {
        detail: "Please draw at least 3 points",
      });
      window.dispatchEvent(event);
      return;
    }
    points.push(points[0]);
    const idx = shapeToExtrude.length;
    const lines = MeshBuilder.CreateLines(
      `lines${idx}`,
      { points, updatable: true },
      scene
    );
    lines.color = new Color3(1, 0, 0);

    shapeToExtrude.push(points);
    useBabylonState.getState().setPoints([]); // Reset points in the state
    useBabylonState.getState().setShapeToExtrude(shapeToExtrude); // Update shapeToExtrude in state

    // Dispose of temporary spheres created for points
    tempPoints.forEach((point) => {
      point.dispose();
    });
    points = []; // Reset local points array for the next shape

    // Notify that the shape is complete and extrusion is enabled
    const event = new CustomEvent("updateInstructions", {
      detail: "Shape created! Extrusion enabled",
    });
    window.dispatchEvent(event);
  }

  // Pointer handlers for dragging (moving) the mesh
  const onPointerDownDrag = (evt: PointerEvent) => {
    if (evt.button !== 0) return;

    // Checks if a shapeExtruded mesh is picked for dragging
    const pickInfo = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => mesh !== ground && mesh.id.startsWith("shapeExtruded")
    );
    if (pickInfo?.hit) {
      currentMesh = pickInfo.pickedMesh;
      startingPoint = getGroundPosition();

      // Disables camera controls while dragging
      if (startingPoint && camera) {
        setTimeout(() => camera.detachControl(canvas), 0);
      }
    }
  };

  // Handles releasing the mesh after drag (ends the move action)
  const onPointerUpDrag = () => {
    if (startingPoint && currentMesh) {
      const material = new StandardMaterial("extrudedMaterial", scene);
      material.emissiveColor = new Color3(0, 128, 128);
      currentMesh.material = material;
      camera?.attachControl(canvas, true); // Reattaches camera control
      startingPoint = null;
      currentMesh = null;
    }
  };

  // Handles pointer movement while dragging, updates the mesh position
  const onPointerMoveDrag = () => {
    if (!startingPoint || !currentMesh) return;

    const current = getGroundPosition();
    if (!current) return;

    const diff = current.subtract(startingPoint);
    currentMesh.position.addInPlace(diff);

    // Update the position of lines associated with the mesh
    const lineMeshId = `lines${currentMesh.id.slice(13)}`;
    const lineMesh = scene.getMeshById(lineMeshId);
    lineMesh?.position.addInPlace(diff);

    startingPoint = current;
  };

  // Highlights the mesh on pointer movement in edit mode
  const hl = new HighlightLayer("hl", scene);
  const onPointerEditMove = function () {
    const result = scene.pick(scene.pointerX, scene.pointerY);
    hl.removeAllMeshes();
    if (result.pickedMesh && result.pickedMesh.id.startsWith("shapeExtruded")) {
      useBabylonState.getState().setSelectedMesh(result.pickedMesh as Mesh);
      hl.addMesh(result.pickedMesh as Mesh, Color3.Blue());
    }
  };

  // Handles pointer down events in edit mode, initializes vertex markers and gizmos
  const onPointerEditDown = function (evt: PointerEvent) {
    const selectedMesh = useBabylonState.getState().getSelectedMesh();
    if (selectedMesh) {
      onMeshSelection();
      const mesh = scene.getMeshById(selectedMesh.id);
      if (mesh) {
        const { vertexMarkers, cornerGroups, markerInstances } =
          createVertexMarkersAndLines(mesh, scene);
        tempVertexMarkers = vertexMarkers;
        attachGizmoAndHandleUpdates(
          scene,
          mesh as Mesh,
          cornerGroups,
          markerInstances
        );
      }
    }
  };

  const onMeshSelection = function () {
    // Remove object selection event listeners
    canvas?.removeEventListener("pointermove", onPointerEditMove, false);
    canvas?.removeEventListener("pointerdown", onPointerEditDown, false);
  };

  // Cleans up observers and event listeners before switching modes
  const cleanUp = () => {
    tempVertexMarkers.forEach((marker) => marker.dispose());
    tempVertexMarkers = [];

    // Removes all pointer observables and listeners
    scene.onPointerObservable.removeCallback(onDrawPointerTapHandler);

    canvas?.removeEventListener("pointerdown", onPointerDownDrag);
    canvas?.removeEventListener("pointerup", onPointerUpDrag);
    canvas?.removeEventListener("pointermove", onPointerMoveDrag);

    canvas?.removeEventListener("pointermove", onPointerEditMove, false);
    canvas?.removeEventListener("pointerdown", onPointerEditDown, false);
  };

  // Adds observers based on the current mode (draw, move, edit)
  const manageObserver = (mode: "draw" | "move" | "edit") => {
    cleanUp();
    if (mode === "draw") {
      scene.onPointerObservable.add(onDrawPointerTapHandler);
    } else if (mode === "move") {
      canvas?.addEventListener("pointerdown", onPointerDownDrag, false);
      canvas?.addEventListener("pointerup", onPointerUpDrag, false);
      canvas?.addEventListener("pointermove", onPointerMoveDrag, false);
    } else if (mode === "edit") {
      canvas?.addEventListener("pointermove", onPointerEditMove, false);
      canvas?.addEventListener("pointerdown", onPointerEditDown, false);
    }
  };

  // Listen for mode changes and set observers accordingly
  manageObserver(useBabylonState.getState().getMode());

  // Subscribe to mode changes dynamically
  const unsubscribe = useBabylonState.subscribe(
    (state) => state.mode,
    (mode) => manageObserver(mode),
    { fireImmediately: true }
  );

  // Cleanup function to unsubscribe when no longer needed
  return () => unsubscribe();
}

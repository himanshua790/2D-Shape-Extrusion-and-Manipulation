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
import useBabylonState from "../lib/useBabylonState";
import { getPointerMaterial } from "../materials/pointerMaterial";
import {
  attachGizmoAndHandleUpdates,
  createVertexMarkersAndLines,
} from "./EditVertices";

export function addButtonObservable() {
  const scene = useBabylonState.getState().getScene();
  if (!scene) return;

  let points = useBabylonState.getState().getPoints();
  let shapeToExtrude = useBabylonState.getState().getShapeToExtrude();
  let startingPoint: Vector3 | null = null;
  let currentMesh: any = null;

  const tempPoints: Mesh[] = [];
  const canvas = scene.getEngine().getRenderingCanvas();
  const ground = scene.getMeshByName("ground");
  console.log({ ground });
  const camera = scene.activeCamera;

  const getGroundPosition = () => {
    const pickInfo = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => mesh === ground
    );
    console.log("getGroundPosition", pickInfo);
    return pickInfo?.hit ? pickInfo.pickedPoint : null;
  };

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

      const event = new CustomEvent("pointCreated", {
        detail: tempPoints,
      });
      window.dispatchEvent(event);
    }
  }

  function onRightClick() {
    if (points.length < 3) {
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

    // remove temp sphere from scene
    tempPoints.forEach((point) => {
      point.dispose();
    });
    points = []; // Reset local points array for the next shape
    const event = new CustomEvent("updateInstructions", {
      detail: "Shape created! Extrution enabled",
    });
    window.dispatchEvent(event);
  }

  // Handlers for Move Mode
  const onPointerDownDrag = (evt: PointerEvent) => {
    if (evt.button !== 0) return;

    const pickInfo = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => mesh !== ground && mesh.id.startsWith("shapeExtruded")
    );
    console.log("onPointerDownDrag", pickInfo);
    if (pickInfo?.hit) {
      currentMesh = pickInfo.pickedMesh;
      startingPoint = getGroundPosition();

      if (startingPoint && camera) {
        setTimeout(() => camera.detachControl(canvas), 0);
      }
    }
  };

  const onPointerUpDrag = () => {
    if (startingPoint && currentMesh) {
      console.log("onPointerUpDrag");
      const material = new StandardMaterial("extrudedMaterial", scene);
      material.emissiveColor = new Color3(0, 128, 128);
      currentMesh.material = material;
      camera?.attachControl(canvas, true);
      startingPoint = null;
      currentMesh = null;
    }
  };

  const onPointerMoveDrag = () => {
    if (!startingPoint || !currentMesh) return;

    console.log("onPointerMoveDrag");
    const current = getGroundPosition();
    if (!current) return;

    const diff = current.subtract(startingPoint);
    currentMesh.position.addInPlace(diff);

    const lineMeshId = `lines${currentMesh.id.slice(13)}`;
    const lineMesh = scene.getMeshByID(lineMeshId);
    lineMesh?.position.addInPlace(diff);

    startingPoint = current;
  };

  // Selecting the Extruded Mesh on Edit Mode
  const hl = new HighlightLayer("hl", scene);
  // Add the highlight layer.
  const onPointerEditMove = function () {
    console.log("onPointerEditMove");
    const result = scene.pick(scene.pointerX, scene.pointerY);
    hl.removeAllMeshes();
    // mesh !== ground && mesh.id.startsWith("shapeExtruded")
    if (result.pickedMesh && result.pickedMesh.id.startsWith("shapeExtruded")) {
      useBabylonState.getState().setSelectedMesh(result.pickedMesh as Mesh);
      hl.addMesh(result.pickedMesh as Mesh, Color3.Blue());
    }
  };

  const onPointerEditDown = function (evt: PointerEvent) {
    console.log("onPointerEditDown");
    const selectedMesh = useBabylonState.getState().getSelectedMesh();
    if (selectedMesh) {
      console.log(selectedMesh);
      onMeshSelection();
      const mesh = scene.getMeshById(selectedMesh.id);
      if (mesh) {
        console.log("Mesh found", mesh);
        const { vertexMarkers, cornerGroups, markerInstances } =
          createVertexMarkersAndLines(selectedMesh, scene);
        console.log(
          "attachGizmoAndHandleUpdates",
          vertexMarkers,
          // lineMeshes,
          cornerGroups
        );
        // canvas?.addEventListener("pointerdown", onPointerEditDown2);
        attachGizmoAndHandleUpdates(
          scene,
          mesh as Mesh,
          vertexMarkers,
          cornerGroups,
          markerInstances
        );
      }
    }
  };
  const onPointerEditDown2 = function (evt: PointerEvent) {
    const result = scene.pick(scene.pointerX, scene.pointerY);
    console.log("onPointerEditDown2", result);
  };

  const onMeshSelection = function () {
    canvas?.removeEventListener("pointermove", onPointerEditMove, false);
    canvas?.removeEventListener("pointerdown", onPointerEditDown, false);
  };

  // Manage observers based on the current mode
  const manageObserver = (mode: "draw" | "move" | "edit") => {
    scene.onPointerObservable.removeCallback(onDrawPointerTapHandler);

    canvas?.removeEventListener("pointerdown", onPointerDownDrag);
    canvas?.removeEventListener("pointerup", onPointerUpDrag);
    canvas?.removeEventListener("pointermove", onPointerMoveDrag);

    canvas?.removeEventListener("pointermove", onPointerEditMove, false);
    canvas?.removeEventListener("pointerdown", onPointerEditDown, false);
    //
    canvas?.removeEventListener("pointerdown", onPointerEditDown2, false);
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

  // Initial setup based on the current mode
  manageObserver(useBabylonState.getState().getMode());

  // Subscribe to mode changes to dynamically manage observers
  const unsubscribe = useBabylonState.subscribe(
    (state) => state.mode,
    (mode) => manageObserver(mode),
    { fireImmediately: true }
  );

  // Cleanup function to unsubscribe when no longer needed
  return () => unsubscribe();
}

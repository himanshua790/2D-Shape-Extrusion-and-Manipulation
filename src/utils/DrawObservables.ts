import {
  Color3,
  HighlightLayer,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  PointerInfo,
  PointerInput,
  StandardMaterial,
  Vector3
} from "@babylonjs/core";
import { getPointerMaterial } from "../materials/PointerMaterial";
import useBabylonState from "../state/GlobalState";
import { enterVertexEditMode } from "./VertixEdit";

// Main function to add observables for drawing, moving, and editing meshes
export function addButtonObservable() {
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

  const getGroundPosition = () => {
    const pickInfo = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => mesh === ground
    );
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
    useBabylonState.getState().setPoints([]);
    useBabylonState.getState().setShapeToExtrude(shapeToExtrude);

    tempPoints.forEach((point) => {
      point.dispose();
    });
    points = [];

    const event = new CustomEvent("updateInstructions", {
      detail: "Shape created! Extrusion enabled",
    });
    window.dispatchEvent(event);
  }

  const onPointerDownDrag = (evt: PointerEvent) => {
    if (evt.button !== 0) return;

    const pickInfo = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => mesh !== ground && mesh.id.startsWith("shapeExtruded")
    );
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
      const material = new StandardMaterial("extrudedMaterial", scene);
      material.emissiveColor = new Color3(0, 128, 128);
      currentMesh.material = material;

      // Bake the current transformation into the vertices to make it permanent
      currentMesh.bakeCurrentTransformIntoVertices();

      // Reset the position to (0, 0, 0) since transformation is baked
      currentMesh.position = Vector3.Zero();

      camera?.attachControl(canvas, true);
      startingPoint = null;
      currentMesh = null;
    }
  };

  const onPointerMoveDrag = () => {
    if (!startingPoint || !currentMesh) return;

    const current = getGroundPosition();
    if (!current) return;

    const diff = current.subtract(startingPoint);
    currentMesh.position.addInPlace(diff);

    startingPoint = current;
  };

  const hl = new HighlightLayer("hl", scene);
  const onPointerEditMove = function () {
    const result = scene.pick(scene.pointerX, scene.pointerY);
    hl.removeAllMeshes();
    if (result.pickedMesh && result.pickedMesh.id.startsWith("shapeExtruded")) {
      useBabylonState.getState().setSelectedMesh(result.pickedMesh as Mesh);
      hl.addMesh(result.pickedMesh as Mesh, Color3.Blue());
    }
  };

  const onPointerEditDown = function (evt: PointerEvent) {
    const selectedMesh = useBabylonState.getState().getSelectedMesh();
    if (selectedMesh) {
      onMeshSelection();
      const mesh = scene.getMeshById(selectedMesh.id);
      if (mesh) {
        console.log("mesh", mesh);
        enterVertexEditMode(mesh as Mesh);
        // const { vertexMarkers, cornerGroups, markerInstances } = createVertexMarkersAndLines(mesh, scene);
        // tempVertexMarkers = vertexMarkers;
        // attachGizmoAndHandleUpdates(scene, mesh as Mesh, cornerGroups, markerInstances);
      }
    }
  };

  const onMeshSelection = function () {
    canvas?.removeEventListener("pointermove", onPointerEditMove, false);
    canvas?.removeEventListener("pointerdown", onPointerEditDown, false);
    hl.removeAllMeshes();

    // Add action for Edit Mode
  };

  const cleanUp = () => {
    tempVertexMarkers.forEach((marker) => marker.dispose());
    tempVertexMarkers = [];

    scene.onPointerObservable.removeCallback(onDrawPointerTapHandler);

    canvas?.removeEventListener("pointerdown", onPointerDownDrag);
    canvas?.removeEventListener("pointerup", onPointerUpDrag);
    canvas?.removeEventListener("pointermove", onPointerMoveDrag);

    canvas?.removeEventListener("pointermove", onPointerEditMove, false);
    canvas?.removeEventListener("pointerdown", onPointerEditDown, false);
  };

  const manageObserver = (mode: "draw" | "move" | "edit") => {
    cleanUp();
    if (mode === "draw") {
      scene.onPointerObservable.add(onDrawPointerTapHandler);
    } else if (mode === "move") {
      canvas?.addEventListener("pointerdown", onPointerDownDrag, false);
      canvas?.addEventListener("pointerup", onPointerUpDrag, false);
      canvas?.addEventListener("pointermove", onPointerMoveDrag, false);
    } else if (mode === "edit") {
      console.log("edit");
      canvas?.addEventListener("pointermove", onPointerEditMove, false);
      canvas?.addEventListener("pointerdown", onPointerEditDown, false);
    }
  };

  manageObserver(useBabylonState.getState().getMode());

  const unsubscribe = useBabylonState.subscribe(
    (state) => state.mode,
    (mode) => manageObserver(mode),
    { fireImmediately: true }
  );

  return () => unsubscribe();
}

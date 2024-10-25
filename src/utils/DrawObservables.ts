import {
  Color3,
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
  const camera = scene.activeCamera;

  const getGroundPosition = () => {
    const pickInfo = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => mesh === ground
    );
    return pickInfo?.hit ? pickInfo.pickedPoint : null;
  };

  // Handlers for Draw Mode
  const onDrawPointerTapHandler = (pointerInfo: PointerInfo) => {
    if (!pointerInfo.pickInfo) return;

    if (
      pointerInfo.type === PointerEventTypes.POINTERTAP &&
      pointerInfo.pickInfo.hit &&
      pointerInfo.pickInfo.pickedMesh?.name === "ground"
    ) {
      switch (pointerInfo.event.inputIndex) {
        case PointerInput.LeftClick:
          onLeftClick(pointerInfo);
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

  function onLeftClick(pointerInfo: PointerInfo) {
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
    }
  }

  function onRightClick() {
    if (points.length < 3) {
      alert("Unable to create shape with less than 3 points!");
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
  }

  // Handlers for Move Mode
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

    const lineMeshId = `lines${currentMesh.id.slice(13)}`;
    const lineMesh = scene.getMeshByID(lineMeshId);
    lineMesh?.position.addInPlace(diff);

    startingPoint = current;
  };

  // Manage observers based on the current mode
  const manageObserver = (mode: "draw" | "move" | "edit") => {
    scene.onPointerObservable.removeCallback(onDrawPointerTapHandler);
    canvas?.removeEventListener("pointerdown", onPointerDownDrag);
    canvas?.removeEventListener("pointerup", onPointerUpDrag);
    canvas?.removeEventListener("pointermove", onPointerMoveDrag);

    if (mode === "draw") {
      scene.onPointerObservable.add(onDrawPointerTapHandler);
    } else if (mode === "move") {
      canvas?.addEventListener("pointerdown", onPointerDownDrag, false);
      canvas?.addEventListener("pointerup", onPointerUpDrag, false);
      canvas?.addEventListener("pointermove", onPointerMoveDrag, false);
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

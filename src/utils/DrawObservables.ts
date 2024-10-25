import {
  Color3,
  MeshBuilder,
  PointerEventTypes,
  PointerInfo,
  PointerInput,
  Vector3,
} from "@babylonjs/core";
import useBabylonState from "../lib/useBabylonState";
import { getPointerMaterial } from "../materials/pointerMaterial";

export function addButtonObservable() {
  const scene = useBabylonState.getState().getScene();
  if (!scene) return;

  let points = useBabylonState.getState().getPoints();
  let shapeToExtrude = useBabylonState.getState().getShapeToExtrude();

  // Define the main handler for drawing actions
  const onDrawPointerTapHandler = (pointerInfo: PointerInfo) => {
    if (!pointerInfo.pickInfo) return; // Safeguard in case pickInfo is null

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
      "lines" + idx.toString(),
      { points, updatable: true },
      scene
    );
    lines.color = new Color3(1, 0, 0);

    shapeToExtrude.push(points);
    useBabylonState.getState().setPoints([]); // Reset points in the state
    useBabylonState.getState().setShapeToExtrude(shapeToExtrude); // Update shapeToExtrude in state
    points = []; // Reset local points array for the next shape
  }

  // Manage observers based on the current mode
  const manageObserver = (mode: "draw" | "move" | "edit") => {
    console.log("manageObserver", mode);

    // Clear only specific handler when switching modes
    scene.onPointerObservable.removeCallback(onDrawPointerTapHandler);

    if (mode === "draw") {
      scene.onPointerObservable.add(onDrawPointerTapHandler);
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

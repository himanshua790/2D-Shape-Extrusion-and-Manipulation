// utils/DrawMode.ts
import {
  MeshBuilder,
  PointerEventTypes,
  PointerInfo,
  PointerInput,
  Color3,
  Mesh,
  Vector3,
  Scene,
  type Nullable,
  Observer,
} from "@babylonjs/core";
import useBabylonState from "../state/GlobalState";
import { getPointerMaterial } from "../materials/PointerMaterial";

let tempPoints: Mesh[] = [];
let drawObserver: Nullable<Observer<PointerInfo>> = null;

export function setupDrawMode(scene: Scene) {
  const ground = scene.getMeshByName("ground") as Mesh;
  ground.isPickable = true;
  const onDrawPointerTapHandler = (pointerInfo: PointerInfo) => {
    if (!pointerInfo.pickInfo) return;
    if (
      pointerInfo.type === PointerEventTypes.POINTERTAP &&
      pointerInfo.pickInfo.hit &&
      pointerInfo.pickInfo.pickedMesh === ground
    ) {
      console.log("draw", pointerInfo.event.inputIndex);
      switch (pointerInfo.event.inputIndex) {
        case PointerInput.LeftClick:
          createPoint(pointerInfo, scene);
          break;
        case PointerInput.RightClick:
          onRightClick(scene);
          break;
      }
    }
  };

  drawObserver = scene.onPointerObservable.add(onDrawPointerTapHandler);
}

function createPoint(pointerInfo: PointerInfo, scene: Scene) {
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
    const points = [
      ...useBabylonState.getState().getPoints(),
      pointSphere.position,
    ];
    useBabylonState.getState().setPoints(points);
    tempPoints.push(pointSphere);

    const event = new CustomEvent("pointCreated", {
      detail: tempPoints,
    });
    window.dispatchEvent(event);
  }
}

function onRightClick(scene: Scene) {
  const points = useBabylonState.getState().getPoints();
  if (points.length < 3) {
    window.dispatchEvent(
      new CustomEvent("updateInstructions", {
        detail: "Please draw at least 3 points",
      })
    );
    return;
  }
  points.push(points[0]);
  const idx = useBabylonState.getState().getShapeToExtrude().length;
  const lines = MeshBuilder.CreateLines(`lines${idx}`, { points }, scene);
  lines.color = new Color3(1, 0, 0);

  const shapeToExtrude = [
    ...useBabylonState.getState().getShapeToExtrude(),
    points,
  ];
  useBabylonState.getState().setShapeToExtrude(shapeToExtrude);
  useBabylonState.getState().setPoints([]);

  tempPoints.forEach((point) => {
    point.dispose();
  });
  tempPoints = [];

  window.dispatchEvent(
    new CustomEvent("updateInstructions", {
      detail: "Shape created! Extrusion enabled",
    })
  );
}

export function cleanupDrawMode(scene: Scene) {
  if (drawObserver) {
    scene.onPointerObservable.remove(drawObserver);
    drawObserver = null;
  }
  tempPoints.forEach((point) => point.dispose());
  tempPoints = [];

  const lines = scene.meshes.filter((mesh) => mesh.name.startsWith("lines"));
  lines.forEach((line) => line.dispose());
}

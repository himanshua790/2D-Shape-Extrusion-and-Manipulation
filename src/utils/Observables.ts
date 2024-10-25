import {
    Color3,
    MeshBuilder,
    PointerEventTypes,
    PointerInfo,
    PointerInput,
    Vector3,
    type Scene,
  } from "@babylonjs/core";
  import { getPointerMaterial } from "../materials/pointerMaterial";
  import { toggleDebugMode } from "../debug/appDebug";
  import useBabylonState from "../lib/useBabylonState";
  
  export function addButtonObservable() {
    const scene = useBabylonState.getState().getScene();
    if (!scene) return;
  
    let points = useBabylonState.getState().getPoints();
    let shapeToExtrude = useBabylonState.getState().getShapeToExtrude();
  
    function onLeftClick(pointerInfo: PointerInfo) {
      console.log("LEFT");
      const pickedPoint = pointerInfo?.pickInfo?.pickedPoint;
      if (pickedPoint) {
        // Create a small sphere at the picked point
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
  
        // Add the new point to the local points array
        points.push(pointSphere.position);
        console.table(points, ["_x", "_y", "_z"]);
  
        // Update points in Zustand state
        useBabylonState.getState().setPoints(points);
      }
    }
  
    function onRightClick() {
      if (points.length < 3) {
        alert("Unable to create shape with less than 3 points!");
        return;
      }
  
      console.log("Draw Shape", points);
      // Complete the shape by adding the first point at the end
      points.push(points[0]);
  
      const idx = shapeToExtrude.length;
      const lines = MeshBuilder.CreateLines(
        "lines" + idx.toString(),
        { points: points, updatable: true },
        scene
      );
      lines.color = new Color3(1, 0, 0);
  
      // Add the shape to the shapeToExtrude array
      shapeToExtrude.push(points);
  
      // Update Zustand state for points and shapeToExtrude
      useBabylonState.getState().setPoints([]); // Reset points in the state
      useBabylonState.getState().setShapeToExtrude(shapeToExtrude); // Update shapeToExtrude in state
  
      // Reset the local points array for the next shape
      points = [];
    }
  
    scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERTAP:
          if (
            pointerInfo?.pickInfo?.hit &&
            pointerInfo.pickInfo.pickedMesh?.name === "ground"
          ) {
            switch (pointerInfo.event.inputIndex) {
              case PointerInput.LeftClick:
                onLeftClick(pointerInfo);
                break;
              case PointerInput.MiddleClick:
                console.log("MIDDLE");
                toggleDebugMode(scene);
                break;
              case PointerInput.RightClick:
                onRightClick();
                break;
            }
          }
          break;
      }
    });
  }
  
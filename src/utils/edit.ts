import {
    Color3,
    Color4,
    Mesh,
    MeshBuilder,
    StandardMaterial,
    Vector3
} from "@babylonjs/core";
import useBabylonState from "../lib/useBabylonState"; // Import Zustand store

export function executeEditMode() {
  const scene = useBabylonState.getState().getScene();
  const moveMode = useBabylonState.getState().getMode() === "move";
  const camera = useBabylonState.getState().getScene()?.activeCamera;
  const shapesToExtrude = useBabylonState.getState().getShapeToExtrude();

  if (!scene || !moveMode || !camera) return;

  const canvas = scene.getEngine().getRenderingCanvas();
  let startingPoint: Vector3 | null = null;
  let currentMesh: Mesh | null = null;

  const ground = scene.getMeshByName("ground");

  const getGroundPosition = () => {
    const pickInfo = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => mesh === ground
    );
    return pickInfo?.hit ? pickInfo.pickedPoint : null;
  };

  const onPointerDownDrag = (evt: PointerEvent) => {
    if (!moveMode) {
      canvas?.removeEventListener("pointerdown", onPointerDownDrag);
      canvas?.removeEventListener("pointerup", onPointerUpDrag);
      canvas?.removeEventListener("pointermove", onPointerMoveDrag);
      return;
    }
    if (evt.button !== 0) return;

    const pickInfo = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => mesh !== ground && mesh.id.startsWith("shapeExtruded")
    );
    if (pickInfo?.hit) {
      currentMesh = pickInfo.pickedMesh as Mesh;
      startingPoint = getGroundPosition();

      if (startingPoint) {
        setTimeout(() => camera.detachControl(canvas), 0);
      }
    }
  };

  const onPointerUpDrag = () => {
    if (startingPoint && currentMesh) {
      const material = new StandardMaterial("extrudedMaterial", scene);
      material.emissiveColor = new Color3(0, 128, 128);
      currentMesh.material = material;
      camera.attachControl(canvas, true);
      startingPoint = null;
    }
  };

  const onPointerMoveDrag = () => {
    if (!startingPoint || !currentMesh) return;

    const current = getGroundPosition();
    if (!current) return;

    const diff = current.subtract(startingPoint);
    currentMesh.position.addInPlace(diff);

    const material = new StandardMaterial("extrudedMaterial", scene);
    material.emissiveColor = new Color3(20, 100, 120);
    currentMesh.material = material;

    // 2D Line Update
    const lineMeshId = "lines" + currentMesh.id.slice(13);
    let lineMesh = scene.getMeshByID(lineMeshId);
    if (lineMesh) lineMesh.position.addInPlace(diff);

    // Update Vertices Mesh
    const idx = Number(currentMesh.id.slice(13));
    const curPointSet = shapesToExtrude[idx];
    const updatedPath: number[] = [];

    for (let i = 0; i < curPointSet.length; i++) {
      const sphereName = `pointMarker${idx}_${i}`;
      const curSphere = scene.getMeshByName(sphereName);
      if (curSphere) {
        curSphere.position.addInPlace(diff);
        curPointSet[i] = curSphere.position;
        updatedPath.push(
          curSphere.position.x,
          curSphere.position.y,
          curSphere.position.z
        );
      } else {
        console.log("Sphere not found: ", sphereName);
        break;
      }
    }

    // Finalize Path Update and Recreate Line Mesh
    const n = curPointSet.length;
    curPointSet[n - 1] = curPointSet[0];
    updatedPath.push(updatedPath[0], updatedPath[1], updatedPath[2]);

    if (lineMesh) lineMesh.dispose();
    lineMesh = MeshBuilder.CreateLines(
      lineMeshId,
      { points: curPointSet },
      scene
    );
    lineMesh.edgesColor = new Color4(0, 1, 0, 1);

    startingPoint = current;
  };

  // Attach event listeners
  canvas?.addEventListener("pointerdown", onPointerDownDrag, false);
  canvas?.addEventListener("pointerup", onPointerUpDrag, false);
  canvas?.addEventListener("pointermove", onPointerMoveDrag, false);
}

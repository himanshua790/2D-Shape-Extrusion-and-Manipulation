// utils/MoveMode.ts
import { Mesh, Scene, Vector3 } from "@babylonjs/core";
import useBabylonState from "../state/GlobalState";

let startingPoint: Vector3 | null = null;
let currentMesh: Mesh | null = null;

export function setupMoveMode(scene: Scene) {
  const canvas = scene.getEngine().getRenderingCanvas();
  const ground = scene.getMeshByName("ground");
  const camera = scene.activeCamera;

  if (ground) {
    ground.isPickable = true; // Prevent the mesh from being picked
  }
  const getGroundPosition = () => {
    const pickInfo = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => mesh === ground
    );
    return pickInfo?.hit ? pickInfo.pickedPoint : null;
  };

  const onPointerDown = (evt: PointerEvent) => {
    console.log("onPointerDown - Move Mode", evt.button, evt.buttons);
    if (evt.button !== 0) return;

    const pickInfo = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => mesh !== ground && mesh.name.startsWith("shapeExtruded")
    );
    if (pickInfo?.hit) {
      currentMesh = pickInfo.pickedMesh as Mesh;
      startingPoint = getGroundPosition();

      camera?.detachControl(canvas);
    }
  };

  const onPointerUp = () => {
    if (startingPoint && currentMesh) {
      currentMesh.bakeCurrentTransformIntoVertices();
      currentMesh.position = Vector3.Zero();

      camera?.attachControl(canvas, true);
      startingPoint = null;
      currentMesh = null;
    }
  };

  const onPointerMove = () => {
    if (!startingPoint || !currentMesh) return;

    const current = getGroundPosition();
    if (!current) return;

    const diff = current.subtract(startingPoint);
    currentMesh.position.addInPlace(diff);
    startingPoint = current;
  };

  canvas?.addEventListener("pointerdown", onPointerDown);
  canvas?.addEventListener("pointerup", onPointerUp);
  canvas?.addEventListener("pointermove", onPointerMove);

  // Store event handlers for cleanup
  useBabylonState.getState().setMoveModeHandlers({
    onPointerDown,
    onPointerUp,
    onPointerMove,
  });
}

export function cleanupMoveMode(scene: Scene) {
  const canvas = scene.getEngine().getRenderingCanvas();
  const handlers = useBabylonState.getState().getMoveModeHandlers();

  if (handlers) {
    canvas?.removeEventListener("pointerdown", handlers.onPointerDown);
    canvas?.removeEventListener("pointerup", handlers.onPointerUp);
    canvas?.removeEventListener("pointermove", handlers.onPointerMove);
  }

  useBabylonState.getState().setMoveModeHandlers(null);
}

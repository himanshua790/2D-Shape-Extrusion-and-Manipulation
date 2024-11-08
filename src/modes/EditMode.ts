// utils/EditMode.ts
import { Mesh, Color3, Scene, HighlightLayer } from "@babylonjs/core";
import useBabylonState from "../state/GlobalState";
import { enterVertexEditMode, exitVertexEditMode } from "../utils/VertixEdit";

let hl: HighlightLayer;

export function setupEditMode(scene: Scene) {
  hl = new HighlightLayer("hl", scene);
  const canvas = scene.getEngine().getRenderingCanvas();

  const ground = scene.getMeshByName("ground");
  if (ground) {
    ground.isPickable = false; // Prevent the mesh from being picked
  }
  const onPointerMove = () => {
    const pickResult = scene.pick(scene.pointerX, scene.pointerY);
    hl.removeAllMeshes();
    if (
      pickResult?.hit &&
      pickResult.pickedMesh?.name.startsWith("shapeExtruded")
    ) {
      hl.addMesh(pickResult.pickedMesh as Mesh, Color3.Blue());
      useBabylonState.getState().setSelectedMesh(pickResult.pickedMesh as Mesh);
    }
  };

  const onPointerDown = (evt: PointerEvent) => {
    console.log("onPointerDown - Edit Mode", evt.button, evt.buttons);
    if (evt.button !== 0) return;

    const selectedMesh = useBabylonState.getState().getSelectedMesh();
    if (selectedMesh) {
      enterVertexEditMode(selectedMesh, scene);
      canvas?.removeEventListener("pointermove", onPointerMove);
      canvas?.removeEventListener("pointerdown", onPointerDown);
      // cleanup hightlight layer
      hl.removeAllMeshes();
    }
  };

  canvas?.addEventListener("pointermove", onPointerMove);
  canvas?.addEventListener("pointerdown", onPointerDown);

  // Store event handlers for cleanup
  useBabylonState.getState().setEditModeHandlers({
    onPointerMove,
    onPointerDown,
  });
}

export function cleanupEditMode(scene: Scene) {
  const canvas = scene.getEngine().getRenderingCanvas();
  const handlers = useBabylonState.getState().getEditModeHandlers();

  if (handlers) {
    canvas?.removeEventListener("pointermove", handlers.onPointerMove);
    canvas?.removeEventListener("pointerdown", handlers.onPointerDown);
  }

  hl?.dispose();
  exitVertexEditMode();

  useBabylonState.getState().setEditModeHandlers(null);
}

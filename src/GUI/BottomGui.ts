import * as GUI from "@babylonjs/gui";
import useBabylonState from "../lib/useBabylonState";
import { extrudeShape } from "../utils/Extrude";
import { toggleDebugMode } from "../debug/appDebug";

export async function addBottomGui() {
  const scene = useBabylonState.getState().getScene();
  const setMode = useBabylonState.getState().setMode;
  const getMode = useBabylonState.getState().getMode;

  if (!scene) return;

  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
    "GUI",
    true,
    scene,
    5,
    true
  );

  await advancedTexture.parseFromSnippetAsync("EOF1Q0#6");

  // Get buttons by name
  const drawButton = advancedTexture.getControlByName(
    "drawButton"
  ) as GUI.Button;
  const extrudeButton = advancedTexture.getControlByName(
    "extrudeButton"
  ) as GUI.Button;
  const editVertexButton = advancedTexture.getControlByName(
    "editVertexButton"
  ) as GUI.Button;
  const resetButton = advancedTexture.getControlByName(
    "resetButton"
  ) as GUI.Button;
  const moveButton = advancedTexture.getControlByName(
    "moveButton"
  ) as GUI.Button;
  const inspectorButton = advancedTexture.getControlByName(
    "inspectorButton"
  ) as GUI.Button;

  // Function to update button backgrounds based on the mode
  function updateButtonBackgrounds() {
    const currentMode = getMode();
    drawButton.background = currentMode === "draw" ? "green" : "gray";
    moveButton.background = currentMode === "move" ? "green" : "gray";
    editVertexButton.background = currentMode === "edit" ? "green" : "gray";
  }

  // Set up button events to change the mode and update Zustand state
  drawButton.onPointerUpObservable.add(() => {
    setMode("draw");
    updateButtonBackgrounds();
    console.log("Draw mode selected");
  });

  moveButton.onPointerUpObservable.add(() => {
    setMode("move");
    updateButtonBackgrounds();
    console.log("Move mode selected");
  });

  editVertexButton.onPointerUpObservable.add(() => {
    setMode("edit");
    updateButtonBackgrounds();
    console.log("Edit mode selected");
  });

  // Action buttons (extrude and reset) - no mode change
  extrudeButton.onPointerUpObservable.add(() => {
    console.log("Extrude action triggered");
    extrudeShape();
  });

  resetButton.onPointerUpObservable.add(() => {
    console.log("Reset action triggered");
  });

  inspectorButton.onPointerUpObservable.add(() => {
    console.log("Inspector action triggered");
    toggleDebugMode()
  });

  // Initial background update based on current mode
  updateButtonBackgrounds();
}

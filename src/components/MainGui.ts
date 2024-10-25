import { Vector3 } from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import { toggleDebugMode } from "../debug/appDebug";
import useBabylonState from "../state/GlobalState";
import { extrudeShape } from "../utils/Extrude";

/**
 * Adds a custom GUI to the BabylonJS scene with various button controls.
 */
export async function addBottomGui() {
  const scene = useBabylonState.getState().getScene();
  const setMode = useBabylonState.getState().setMode;
  const getMode = useBabylonState.getState().getMode;

  if (!scene) return;

  // Create fullscreen UI for GUI elements
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI(
    "GUI",
    true,
    scene,
    5,
    true
  );
  await advancedTexture.parseFromSnippetAsync("EOF1Q0#7");

  // Get buttons and instruction text by name
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
  const instructionText = advancedTexture.getControlByName(
    "instructions"
  ) as GUI.TextBlock;

  /**
   * Updates the background color of buttons and enables/disables
   * the extrude button based on the current mode and state values.
   */
  function updateButtonBackgrounds() {
    const currentMode = getMode();

    drawButton.background = currentMode === "draw" ? "green" : "gray";
    moveButton.background = currentMode === "move" ? "green" : "gray";
    editVertexButton.background = currentMode === "edit" ? "green" : "gray";

    // Update extrude button based on points and shape availability
    updateExtrudeButton();
  }

  /**
   * Enables or disables the extrude button based on conditions.
   */
  function updateExtrudeButton() {
    const points = useBabylonState.getState().getPoints();
    const shapeToExtrude = useBabylonState.getState().getShapeToExtrude();

    extrudeButton.isEnabled = points.length > 2 || shapeToExtrude.length > 0;
    extrudeButton.background = extrudeButton.isEnabled ? "blue" : "gray";
  }

  /**
   * Custom event to update instruction text in the UI.
   * @param text - Instruction message to display
   */
  function triggerUpdateInstructions(text: string) {
    const event = new CustomEvent("updateInstructions", { detail: text });
    window.dispatchEvent(event);
  }

  // Listener for custom instruction updates
  window.addEventListener("updateInstructions", (event: Event) => {
    const customEvent = event as CustomEvent;
    instructionText.text = customEvent.detail;
  });

  // Add an event listener for the custom "pointCreated" event
  window.addEventListener("pointCreated", (event: Event) => {
    // Cast the event to a CustomEvent to access the 'detail' property
    const customEvent = event as CustomEvent<Vector3[]>;
    const points = customEvent.detail;

    if (points.length < 3) {
      instructionText.text = "Draw at least 3 points to create shape.";
    } else {
      instructionText.text = "Right click to complete shape.";
    }

    updateExtrudeButton();
  });

  // Draw mode button action
  drawButton.onPointerUpObservable.add(() => {
    setMode("draw");
    triggerUpdateInstructions(
      "Draw mode enabled. Right-click to complete the path."
    );
    updateButtonBackgrounds();
  });

  // Move mode button action
  moveButton.onPointerUpObservable.add(() => {
    setMode("move");
    triggerUpdateInstructions("Move mode enabled.");
    updateButtonBackgrounds();
  });

  // Edit mode button action
  editVertexButton.onPointerUpObservable.add(() => {
    setMode("edit");
    triggerUpdateInstructions("Edit mode enabled. Select a Object to edit.");
    updateButtonBackgrounds();
  });

  // Extrude button action - only works in "draw" mode with enough points
  extrudeButton.onPointerUpObservable.add(() => {
    const points = useBabylonState.getState().getPoints();
    const shapeToExtrude = useBabylonState.getState().getShapeToExtrude();
    if (
      getMode() === "draw" &&
      (points.length > 2 || shapeToExtrude.length > 0)
    ) {
      extrudeShape();
      triggerUpdateInstructions("Extrusion completed.");
    }
  });

  // Reset button action - refreshes the page to reset the scene
  resetButton.onPointerUpObservable.add(() => {
    resetScene();
  });

  // Inspector button action - toggles debug mode
  inspectorButton.onPointerUpObservable.add(() => {
    toggleDebugMode();
  });

  // Initial button background and state setup
  updateButtonBackgrounds();

  // Subscribe to shapeToExtrude changes to enable extrude button if non-empty
  useBabylonState.subscribe(
    (state) => state.shapeToExtrude,
    (shapeToExtrude) => {
      if (shapeToExtrude.length > 0) {
        updateExtrudeButton();
      }
    },
    { fireImmediately: true }
  );
}

/**
 * Resets the scene by refreshing the browser.
 */
function resetScene() {
  window.location.reload(); // Refresh the browser to reset the scene completely
}

// utils/EventManager.ts
import useBabylonState from "../state/GlobalState";
import { cleanupDrawMode, setupDrawMode } from "../modes/DrawMode";
import { setupEditMode, cleanupEditMode } from "../modes/EditMode";
import type { Scene } from "@babylonjs/core";
import { cleanupMoveMode, setupMoveMode } from "../modes/MoveMode";

export function manageObserver(scene: Scene) {
  let currentMode = useBabylonState.getState().getMode();

  const unsubscribe = useBabylonState.subscribe(
    (state) => state.mode,
    (mode) => {
      // Cleanup previous mode
      switch (currentMode) {
        case "draw":
          cleanupDrawMode(scene);
          break;
        case "move":
          cleanupMoveMode(scene);
          break;
        case "edit":
          cleanupEditMode(scene);
          break;
      }

      // Setup new mode
      switch (mode) {
        case "draw":
          setupDrawMode(scene);
          break;
        case "move":
          setupMoveMode(scene);
          break;
        case "edit":
          setupEditMode(scene);
          break;
      }

      currentMode = mode;
    },
    { fireImmediately: true }
  );

  return unsubscribe;
}

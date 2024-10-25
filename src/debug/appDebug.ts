
// Go big or go...
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/core/Legacy/legacy";
import "@babylonjs/inspector";
import useBabylonState from "../lib/useBabylonState";

/**
 * Toggles on/off the inspector in the scene.
 * Keeping this as a separate file helps with code splitting and let us
 * Only download the full bjs code if debug mode has been requested.
 * @param scene defines the sence to inspect
 */
export function toggleDebugMode(): void {
  const scene = useBabylonState.getState().getScene();
  if (!scene) {
    return;
  }
  if (scene.debugLayer.isVisible()) {
    scene.debugLayer.hide();
  } else {
    scene.debugLayer.show({
      embedMode: true,
    });
  }
}

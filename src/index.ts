// index.ts
import {
  Engine,
  Scene,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  DefaultLoadingScreen,
} from "@babylonjs/core";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import useBabylonState from "./state/GlobalState";
import "./index.css";
import { getGridMaterial } from "./materials/GridMaterial";
import { addBottomGui } from "./components/MainGui";
import { manageObserver } from "./utils/EventManger";

DefaultLoadingScreen.prototype.displayLoadingUI = () => {};
const canvas = document.createElement("canvas");
document.body.append(canvas);

const antialias = true;
const adaptToDeviceRatio = true;
const engine = new Engine(canvas, antialias, {}, adaptToDeviceRatio);
const scene = new Scene(engine);

// Store the scene in Zustand state
useBabylonState.getState().setScene(scene);

const camera = new ArcRotateCamera(
  "camera",
  0,
  0,
  5,
  new Vector3(0, 0, 0),
  scene
);
camera.position = new Vector3(10, 10, 10);
camera.attachControl(canvas, true);

// Light
new HemisphericLight("light", new Vector3(0, 1, 0), scene);

// Ground

for (const texture of scene.textures) {
  texture.updateSamplingMode(1);
}

// Creating Base Mesh and using the Zustand store for points and shapes
const width = 10;
const height = 10;
const subdivisions = 1;

const ground = MeshBuilder.CreateGround(
  "ground",
  { width, height, subdivisions },
  scene
);
ground.position.y = -0.01;
ground.material = getGridMaterial("ground", scene);

// Add GUI
addBottomGui();

// Manage Observers
const unsubscribe = manageObserver(scene);

// Run the render loop
engine.runRenderLoop(() => {
  scene.render();
});

// Handle resize
window.addEventListener("resize", () => {
  engine.resize();
});

// Cleanup on unload
window.addEventListener("beforeunload", () => {
  unsubscribe();
  engine.dispose();
});

import { HemisphericLight } from "@babylonjs/core";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { DefaultLoadingScreen } from "@babylonjs/core/Loading/loadingScreen";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { addBottomGui } from "./components/MainGui";
import "./index.css";
import useBabylonState from "./state/GlobalState"; // Import Zustand store
import { getGridMaterial } from "./materials/GridMaterial";
import { addButtonObservable } from "./utils/DrawObservables";

DefaultLoadingScreen.prototype.displayLoadingUI = () => {};

const canvas = document.createElement("canvas");
document.body.append(canvas);

const antialias = true;
const adaptToDeviceRatio = true;

let engine: Engine | WebGPUEngine;

if (navigator.gpu) {
  engine = new WebGPUEngine(canvas, { antialias, adaptToDeviceRatio });
  await (engine as WebGPUEngine).initAsync();
} else {
  engine = new Engine(canvas, antialias, {}, adaptToDeviceRatio);
}

const scene = new Scene(engine);

// Store the scene in Zustand state
useBabylonState.getState().setScene(scene);

const alpha = 0;
const beta = 0;
const radius = 5;
const target = new Vector3(-4, 1, 5);
const camera = new ArcRotateCamera(
  "camera",
  alpha,
  beta,
  radius,
  target,
  scene
);

camera.setTarget(Vector3.Zero());
camera.attachControl(canvas, true);

// Light Creation
const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
light.intensity = 0.7;

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

// Add button observables with updated Zustand state
addButtonObservable();
// Add GUI and functionality
addBottomGui();

// Run the Babylon.js render loop
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", function () {
  engine.resize();
});

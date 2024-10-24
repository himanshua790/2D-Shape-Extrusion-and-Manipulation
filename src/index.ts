import { DefaultLoadingScreen } from '@babylonjs/core/Loading/loadingScreen';
import './index.css'
import  { Engine } from '@babylonjs/core/Engines/engine';
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine';
import { Scene } from '@babylonjs/core/scene';
import { Color3, Vector3 } from '@babylonjs/core/Maths/math';
import {ArcRotateCamera} from "@babylonjs/core/Cameras/arcRotateCamera"
import {MeshBuilder} from "@babylonjs/core/Meshes/meshBuilder"
import { getGridMaterial } from './materials/gridMaterial';
DefaultLoadingScreen.prototype.displayLoadingUI = () => {}

const canvas = document.createElement('canvas')
document.body.append(canvas)

const antialias = true
const adaptToDeviceRatio = true

let engine: Engine | WebGPUEngine

if (navigator.gpu) {
  engine = new WebGPUEngine(canvas, { antialias, adaptToDeviceRatio })
  await (engine as WebGPUEngine).initAsync()
} else {
  engine = new Engine(canvas, antialias, {}, adaptToDeviceRatio)
}

const scene = new Scene(engine)

const alpha = 0
const beta = 0
const radius = 5
const target = new Vector3(-4, 1, 5)
const camera = new ArcRotateCamera('camera', alpha, beta, radius, target, scene)

camera.setTarget(Vector3.Zero())
camera.attachControl(canvas, true)

let inspectorReady = false
let inspectorOpen = true

if (import.meta.env.MODE === 'development') {
  window.addEventListener('keydown', async ({ key }) => {
    if (key.toLowerCase() !== 'i') return
  
    if (inspectorReady === false) {
      await import('@babylonjs/core/Debug/debugLayer')
      await import('@babylonjs/inspector')
      inspectorReady = true
    }

    if (inspectorOpen === true) {
      localStorage.setItem('inspector', 'true')
      scene.debugLayer.hide()
    } else {
      localStorage.removeItem('inspector')
      scene.debugLayer.show()
    }
  })

  if (localStorage.getItem('inspector')) {
    scene.debugLayer.show()
  }  
}

for (const texture of scene.textures) {
  texture.updateSamplingMode(1)
}

{
  const width = 10
  const height = 10
  const subdivisions = 1
  const ground = MeshBuilder.CreateGround('ground', { width, height, subdivisions }, scene)
  ground.position.y = -0.01

  ground.material = getGridMaterial("ground", scene);
}

engine.runRenderLoop(() => scene.render())

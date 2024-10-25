import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import { Vector3 } from "@babylonjs/core";
import type { Mesh, Scene } from "@babylonjs/core";

interface BabylonState {
  scene: Scene | null;
  mode: "draw" | "move" | "edit";
  points: Vector3[];
  shapeToExtrude: Vector3[][];
  shapesExtruded: boolean[];
  shapePointsMap: Map<string, Vector3[]>; // Map to store points for each extruded shape
  selectedMesh: Mesh | null;
  extrudePathCompleted: boolean;

  getScene: () => Scene | null;
  getMode: () => "draw" | "move" | "edit";
  getPoints: () => Vector3[];
  getShapeToExtrude: () => Vector3[][];
  getShapesExtruded: () => boolean[];
  getShapePointsMap: () => Map<string, Vector3[]>;
  getSelectedMesh: () => Mesh | null;
  getExtrudePathCompleted: () => boolean;

  setScene: (scene: Scene) => void;
  setMode: (mode: "draw" | "move" | "edit") => void;
  setPoints: (points: Vector3[]) => void;
  setShapeToExtrude: (shape: Vector3[][]) => void;
  setMarkAsExtruded: (list: boolean[]) => void;
  setShapePointsMap: (map: Map<string, Vector3[]>) => void;
  setSelectedMesh: (mesh: Mesh | null) => void;
  setExtrudePathCompleted: (value: boolean) => void;
}

const useBabylonState = createStore(
  subscribeWithSelector<BabylonState>((set, get) => ({
    scene: null,
    mode: "draw",
    points: [],
    shapeToExtrude: [],
    shapesExtruded: [],
    shapePointsMap: new Map<string, Vector3[]>(),
    selectedMesh: null,
    extrudePathCompleted: false,

    getScene: () => get().scene,
    getMode: () => get().mode,
    getPoints: () => get().points,
    getShapeToExtrude: () => get().shapeToExtrude,
    getShapesExtruded: () => get().shapesExtruded,
    getShapePointsMap: () => get().shapePointsMap,
    getSelectedMesh: () => get().selectedMesh,
    getExtrudePathCompleted: () => get().extrudePathCompleted,

    setScene: (scene) => set({ scene }),
    setMode: (mode) => set({ mode }),
    setPoints: (points) => set({ points }),
    setShapeToExtrude: (shape) => set({ shapeToExtrude: shape }),
    setMarkAsExtruded: (list) => set({ shapesExtruded: list }),
    setShapePointsMap: (map) => set({ shapePointsMap: map }),
    setSelectedMesh: (mesh) => set({ selectedMesh: mesh }),
    setExtrudePathCompleted: (value) => set({ extrudePathCompleted: value }),
  }))
);

export default useBabylonState;

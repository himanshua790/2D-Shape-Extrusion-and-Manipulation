import type { Scene } from "@babylonjs/core";
import { createStore } from "zustand/vanilla";
import { Vector3 } from "@babylonjs/core";

interface BabylonState {
  // initial state
  scene: Scene | null;
  mode: "draw" | "move" | "edit";
  points: Vector3[];
  shapeToExtrude: Vector3[][];
  shapesExtruded: boolean[];

  // getters
  getScene: () => Scene | null;
  getMode: () => "draw" | "move" | "edit";
  getPoints: () => Vector3[];
  getShapeToExtrude: () => Vector3[][];
  getShapesExtruded: () => boolean[];

  // setters
  setScene: (scene: Scene) => void;
  setMode: (mode: "draw" | "move" | "edit") => void;
  setPoints: (points: Vector3[]) => void;
  setShapeToExtrude: (shape: Vector3[][]) => void;
  setMarkAsExtruded: (list: boolean[]) => void;
}

// Define Zustand store with explicit function implementations for getters
const useBabylonState = createStore<BabylonState>((set, get) => ({
  // Initial state values
  scene: null,
  mode: "draw",
  points: [],
  shapeToExtrude: [],
  shapesExtruded: [],

  // Getters with explicit return types
  getScene: () => get().scene,
  getMode: () => get().mode,
  getPoints: () => get().points,
  getShapeToExtrude: () => get().shapeToExtrude,
  getShapesExtruded: () => get().shapesExtruded,

  // Setters
  setScene: (scene) => set({ scene }),
  setMode: (mode) => set({ mode }),
  setPoints: (points) => set({ points }),
  setShapeToExtrude: (shape) => set({ shapeToExtrude: shape }),
  setMarkAsExtruded: (list) => set({ shapesExtruded: list }),
}));

export default useBabylonState;

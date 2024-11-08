// state/GlobalState.ts

import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import { Vector3 } from "@babylonjs/core";
import type { Mesh, Scene } from "@babylonjs/core";

interface BabylonState {
  scene: Scene | null;
  mode: "draw" | "move" | "edit";
  points: Vector3[];
  extrudeLength: number;
  shapeToExtrude: Vector3[][];
  shapesExtruded: boolean[];
  shapePointsMap: Map<string, Vector3[]>; // Map to store points for each extruded shape
  selectedMesh: Mesh | null;
  extrudePathCompleted: boolean;
  vertexMarkers: Mesh[];
  moveModeHandlers: {
    onPointerDown: (evt: PointerEvent) => void;
    onPointerUp: () => void;
    onPointerMove: () => void;
  } | null;
  editModeHandlers: {
    onPointerMove: () => void;
    onPointerDown: (evt: PointerEvent) => void;
  } | null;

  // New state variables
  meshVertices: Vector3[];
  selectedMarkers: Mesh[];
  dragMesh: Mesh | null;
  vertexEditModeHandlers: {
    onPointerMove: Function;
    onPointerDown: Function;
  } | null;
  meshInEditMode: Mesh | null;

  // Getters
  getScene: () => Scene | null;
  getMode: () => "draw" | "move" | "edit";
  getPoints: () => Vector3[];
  getShapeToExtrude: () => Vector3[][];
  getShapesExtruded: () => boolean[];
  getShapePointsMap: () => Map<string, Vector3[]>;
  getSelectedMesh: () => Mesh | null;
  getExtrudePathCompleted: () => boolean;
  getVertexMarkers: () => Mesh[];
  getMoveModeHandlers: () => {
    onPointerDown: (evt: PointerEvent) => void;
    onPointerUp: () => void;
    onPointerMove: () => void;
  } | null;
  getEditModeHandlers: () => {
    onPointerMove: () => void;
    onPointerDown: (evt: PointerEvent) => void;
  } | null;

  // New getters
  getMeshVertices: () => Vector3[];
  getSelectedMarkers: () => Mesh[];
  getDragMesh: () => Mesh | null;
  getVertexEditModeHandlers: () => {
    onPointerMove: Function;
    onPointerDown: Function;
  } | null;
  getMeshInEditMode: () => Mesh | null;

  // Setters
  setScene: (scene: Scene) => void;
  setMode: (mode: "draw" | "move" | "edit") => void;
  setPoints: (points: Vector3[]) => void;
  setShapeToExtrude: (shape: Vector3[][]) => void;
  setMarkAsExtruded: (list: boolean[]) => void;
  setShapePointsMap: (map: Map<string, Vector3[]>) => void;
  setSelectedMesh: (mesh: Mesh | null) => void;
  setExtrudePathCompleted: (value: boolean) => void;
  setVertexMarkers: (markers: Mesh[]) => void;
  setMoveModeHandlers: (
    handlers: {
      onPointerDown: (evt: PointerEvent) => void;
      onPointerUp: () => void;
      onPointerMove: () => void;
    } | null
  ) => void;
  setEditModeHandlers: (
    handlers: {
      onPointerMove: () => void;
      onPointerDown: (evt: PointerEvent) => void;
    } | null
  ) => void;

  // New setters
  setMeshVertices: (vertices: Vector3[]) => void;
  setSelectedMarkers: (markers: Mesh[]) => void;
  setDragMesh: (mesh: Mesh | null) => void;
  setVertexEditModeHandlers: (
    handlers: {
      onPointerMove: Function;
      onPointerDown: Function;
    } | null
  ) => void;
  setMeshInEditMode: (mesh: Mesh | null) => void;
}

const useBabylonState = createStore(
  subscribeWithSelector<BabylonState>((set, get) => ({
    scene: null,
    mode: "draw",
    extrudeLength: 2,
    points: [],
    shapeToExtrude: [],
    shapesExtruded: [],
    shapePointsMap: new Map<string, Vector3[]>(),
    selectedMesh: null,
    extrudePathCompleted: false,
    vertexMarkers: [],
    moveModeHandlers: null,
    editModeHandlers: null,

    // New state variables initialization
    meshVertices: [],
    selectedMarkers: [],
    dragMesh: null,
    vertexEditModeHandlers: null,
    meshInEditMode: null,

    // Getters
    getScene: () => get().scene,
    getMode: () => get().mode,
    getPoints: () => get().points,
    getShapeToExtrude: () => get().shapeToExtrude,
    getShapesExtruded: () => get().shapesExtruded,
    getShapePointsMap: () => get().shapePointsMap,
    getSelectedMesh: () => get().selectedMesh,
    getExtrudePathCompleted: () => get().extrudePathCompleted,
    getVertexMarkers: () => get().vertexMarkers,
    getMoveModeHandlers: () => get().moveModeHandlers,
    getEditModeHandlers: () => get().editModeHandlers,

    // New getters
    getMeshVertices: () => get().meshVertices,
    getSelectedMarkers: () => get().selectedMarkers,
    getDragMesh: () => get().dragMesh,
    getVertexEditModeHandlers: () => get().vertexEditModeHandlers,
    getMeshInEditMode: () => get().meshInEditMode,

    // Setters
    setScene: (scene) => set({ scene }),
    setMode: (mode) => set({ mode }),
    setPoints: (points) => set({ points }),
    setShapeToExtrude: (shape) => set({ shapeToExtrude: shape }),
    setMarkAsExtruded: (list) => set({ shapesExtruded: list }),
    setShapePointsMap: (map) => set({ shapePointsMap: map }),
    setSelectedMesh: (mesh) => set({ selectedMesh: mesh }),
    setExtrudePathCompleted: (value) => set({ extrudePathCompleted: value }),
    setVertexMarkers: (markers) => set({ vertexMarkers: markers }),
    setMoveModeHandlers: (handlers) => set({ moveModeHandlers: handlers }),
    setEditModeHandlers: (handlers) => set({ editModeHandlers: handlers }),

    // New setters
    setMeshVertices: (vertices) => set({ meshVertices: vertices }),
    setSelectedMarkers: (markers) => set({ selectedMarkers: markers }),
    setDragMesh: (mesh) => set({ dragMesh: mesh }),
    setVertexEditModeHandlers: (handlers) => set({ vertexEditModeHandlers: handlers }),
    setMeshInEditMode: (mesh) => set({ meshInEditMode: mesh }),
  }))
);

export default useBabylonState;

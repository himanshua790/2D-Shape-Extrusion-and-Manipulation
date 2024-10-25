## Babylon Shape Extrusion & Manipulation Project

This project is a Babylon.js application designed to allow users to draw, extrude, and manipulate 2D shapes on a ground plane, following assignment requirements. Built using Vite, Babylon.js, Havok Physics, and TypeScript, it serves as a foundational template for 3D manipulation projects.

---

### Getting Started

1. **Install dependencies**: `npm install`
2. **Run the project**: `npm start` (Runs Vite)

---

### Instructions

**Assignment**: Babylon.js 2D Shape Extrusion and Manipulation

**Goal**:  
Create an interactive 3D environment in which users can draw 2D shapes, extrude them into 3D forms, and modify the shapes through vertex manipulation.

---

### Checklist

- [x] **Babylon.js Scene**: Set up a 3D scene with a ground plane.
- [x] **Draw Mode**: Enable drawing 2D shapes on the ground plane using mouse interactions.
    - *Left-click*: Add points.
    - *Right-click*: Complete the shape.
    - Provide a **"Draw"** button to enter Draw Mode.
- [x] **Extrude Shape**: Extrude the completed shape into a 3D object with a fixed height.
    - Provide a UI element to initiate extrusion.
- [x] **Move Mode**: Allow moving of extruded shapes on the ground plane.
    - Enable click-and-drag for movement.
    - Provide a **"Move"** button to enter Move Mode.
- [ ] **Vertex Edit Mode**: Allow editing of vertices for extruded objects.
    - *Click-and-drag*: Adjust vertex position.
    - Enable free movement of all vertices in 3D space.
    - Provide a **"Vertex Edit"** button to enter Vertex Edit Mode.
- [x] **UI Visual Cues**: Show visual indicators for selected objects and active editing modes.

---

### Bonus Features

- **Enhanced GUI**: Add a user-friendly interface with clear instructions for each mode.
- **Conditional Buttons**: Enable and disable buttons based on current mode and shape state.
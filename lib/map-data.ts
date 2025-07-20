import type { MapNode, MapEdge } from "./types"

// Mock data for Lovely Professional University (LPU) blocks and connections
// Coordinates (x, y) are relative for SVG rendering (e.g., 0-100 scale)
export const lpuMapNodes: MapNode[] = [
  { id: "block-1", name: "Block 1 (Main Gate)", x: 10, y: 50 },
  { id: "block-2", name: "Block 2 (Academic Block)", x: 30, y: 20 },
  { id: "block-3", name: "Block 3 (Library)", x: 30, y: 80 },
  { id: "block-4", name: "Block 4 (Student Center)", x: 50, y: 50 },
  { id: "block-5", name: "Block 5 (Engineering Block)", x: 70, y: 20 },
  { id: "block-6", name: "Block 6 (Management Block)", x: 70, y: 80 },
  { id: "block-7", name: "Block 7 (Sports Complex)", x: 90, y: 50 },
]

export const lpuMapEdges: MapEdge[] = [
  { from: "block-1", to: "block-2", distance: 200 }, // meters
  { from: "block-1", to: "block-3", distance: 250 },
  { from: "block-2", to: "block-4", distance: 150 },
  { from: "block-3", to: "block-4", distance: 180 },
  { from: "block-4", to: "block-5", distance: 220 },
  { from: "block-4", to: "block-6", distance: 200 },
  { from: "block-5", to: "block-7", distance: 100 },
  { from: "block-6", to: "block-7", distance: 120 },
  { from: "block-2", to: "block-5", distance: 300 }, // Direct path
  { from: "block-3", to: "block-6", distance: 350 }, // Direct path
]

// Helper to get node by ID
export const getNodeById = (nodeId: string): MapNode | undefined => {
  return lpuMapNodes.find((node) => node.id === nodeId)
}

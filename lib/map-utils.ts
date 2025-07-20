import type { MapNode, MapEdge, PathResult } from "./types"

interface Graph {
  [nodeId: string]: {
    [neighborId: string]: number // distance to neighbor
  }
}

/**
 * Builds an adjacency list representation of the campus map graph.
 * @param nodes Array of MapNode objects.
 * @param edges Array of MapEdge objects.
 * @returns A graph object.
 */
export const buildGraph = (nodes: MapNode[], edges: MapEdge[]): Graph => {
  const graph: Graph = {}
  nodes.forEach((node) => {
    graph[node.id] = {}
  })

  edges.forEach((edge) => {
    // Add bidirectional edges
    graph[edge.from][edge.to] = edge.distance
    graph[edge.to][edge.from] = edge.distance
  })

  return graph
}

/**
 * Implements Dijkstra's algorithm to find the shortest path between two nodes.
 * @param graph The graph representation (adjacency list).
 * @param startNodeId The ID of the starting node.
 * @param endNodeId The ID of the ending node.
 * @returns A PathResult object containing the shortest path and total distance, or null if no path exists.
 */
export const dijkstra = (graph: Graph, startNodeId: string, endNodeId: string): PathResult | null => {
  const distances: { [nodeId: string]: number } = {}
  const previousNodes: { [nodeId: string]: string | null } = {}
  const unvisitedNodes = new Set<string>(Object.keys(graph))

  // Initialize distances
  Object.keys(graph).forEach((nodeId) => {
    distances[nodeId] = Number.POSITIVE_INFINITY
    previousNodes[nodeId] = null
  })
  distances[startNodeId] = 0

  while (unvisitedNodes.size > 0) {
    // Find the unvisited node with the smallest distance
    let currentNodeId: string | null = null
    for (const nodeId of unvisitedNodes) {
      if (currentNodeId === null || distances[nodeId] < distances[currentNodeId]) {
        currentNodeId = nodeId
      }
    }

    if (currentNodeId === null || distances[currentNodeId] === Number.POSITIVE_INFINITY) {
      // No path to remaining unvisited nodes
      break
    }

    unvisitedNodes.delete(currentNodeId)

    if (currentNodeId === endNodeId) {
      // Path found, reconstruct it
      const path: string[] = []
      let current = endNodeId
      while (current !== null) {
        path.unshift(current)
        current = previousNodes[current]!
        if (current === startNodeId) {
          // Add start node and break
          path.unshift(current)
          break
        }
      }
      return { path, distance: distances[endNodeId] }
    }

    // Update distances to neighbors
    for (const neighborId in graph[currentNodeId]) {
      const distance = graph[currentNodeId][neighborId]
      const newDistance = distances[currentNodeId] + distance

      if (newDistance < distances[neighborId]) {
        distances[neighborId] = newDistance
        previousNodes[neighborId] = currentNodeId
      }
    }
  }

  return null // No path found
}

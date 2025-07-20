"use client"

import { Label } from "@/components/ui/label"

import { Badge } from "@/components/ui/badge"

import React, { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Map, XCircle } from "lucide-react"
import { lpuMapNodes, lpuMapEdges, getNodeById } from "@/lib/map-data"
import { buildGraph, dijkstra } from "@/lib/map-utils"
import type { PathResult } from "@/lib/types"

export default function CampusMap() {
  const [startNodeId, setStartNodeId] = useState<string | null>(null)
  const [endNodeId, setEndNodeId] = useState<string | null>(null)
  const [pathResult, setPathResult] = useState<PathResult | null>(null)

  const graph = useMemo(() => buildGraph(lpuMapNodes, lpuMapEdges), [])

  const handleFindPath = () => {
    if (startNodeId && endNodeId) {
      const result = dijkstra(graph, startNodeId, endNodeId)
      setPathResult(result)
    } else {
      setPathResult(null)
    }
  }

  const handleClearPath = () => {
    setStartNodeId(null)
    setEndNodeId(null)
    setPathResult(null)
  }

  // SVG dimensions
  const svgWidth = 800
  const svgHeight = 600
  const nodeRadius = 10
  const scaleX = svgWidth / 100 // Assuming map data x,y are 0-100
  const scaleY = svgHeight / 100

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">LPU Campus Map</h2>
        <Badge className="bg-blue-400 text-white">Navigation</Badge>
      </div>

      <Card className="card-effect mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="start-location" className="mb-2 block">
                Start Location
              </Label>
              <Select onValueChange={setStartNodeId} value={startNodeId || ""}>
                <SelectTrigger id="start-location">
                  <SelectValue placeholder="Select start block" />
                </SelectTrigger>
                <SelectContent>
                  {lpuMapNodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="end-location" className="mb-2 block">
                End Location
              </Label>
              <Select onValueChange={setEndNodeId} value={endNodeId || ""}>
                <SelectTrigger id="end-location">
                  <SelectValue placeholder="Select end block" />
                </SelectTrigger>
                <SelectContent>
                  {lpuMapNodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFindPath} disabled={!startNodeId || !endNodeId} className="button-effect">
                <Map className="h-4 w-4 mr-2" /> Find Path
              </Button>
              <Button onClick={handleClearPath} variant="outline">
                <XCircle className="h-4 w-4 mr-2" /> Clear
              </Button>
            </div>
          </div>

          {pathResult && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200">
              <p className="font-semibold">Shortest Path Found:</p>
              <p className="text-sm">
                Path: {pathResult.path.map((id) => lpuMapNodes.find((n) => n.id === id)?.name || id).join(" → ")}
              </p>
              <p className="text-sm">Total Distance: {pathResult.distance} meters</p>
            </div>
          )}
          {pathResult === null && startNodeId && endNodeId && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
              <p className="font-semibold">No path found between selected locations.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-effect">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-slate-200">Interactive Campus Map</CardTitle>
        </CardHeader>
        <CardContent>
          <svg width={svgWidth} height={svgHeight} className="border rounded-lg bg-slate-50 dark:bg-slate-900">
            {/* Draw Edges */}
            {lpuMapEdges.map((edge, index) => {
              const fromNode = getNodeById(edge.from)
              const toNode = getNodeById(edge.to)
              if (!fromNode || !toNode) return null

              const isPathEdge =
                pathResult?.path.includes(fromNode.id) &&
                pathResult?.path.includes(toNode.id) &&
                (pathResult.path.indexOf(toNode.id) === pathResult.path.indexOf(fromNode.id) + 1 ||
                  pathResult.path.indexOf(fromNode.id) === pathResult.path.indexOf(toNode.id) + 1)

              return (
                <React.Fragment key={index}>
                  <line
                    x1={fromNode.x * scaleX}
                    y1={fromNode.y * scaleY}
                    x2={toNode.x * scaleX}
                    y2={toNode.y * scaleY}
                    stroke={isPathEdge ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                    strokeWidth={isPathEdge ? 4 : 2}
                    className="transition-all duration-300"
                  />
                  {/* Optional: Display distance on the line */}
                  <text
                    x={(fromNode.x * scaleX + toNode.x * scaleX) / 2}
                    y={(fromNode.y * scaleY + toNode.y * scaleY) / 2 - 5}
                    fontSize="10"
                    fill={isPathEdge ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"}
                    textAnchor="middle"
                    className="transition-all duration-300"
                  >
                    {edge.distance}m
                  </text>
                </React.Fragment>
              )
            })}

            {/* Draw Nodes */}
            {lpuMapNodes.map((node) => {
              const isStart = startNodeId === node.id
              const isEnd = endNodeId === node.id
              const isInPath = pathResult?.path.includes(node.id)

              return (
                <g key={node.id}>
                  <circle
                    cx={node.x * scaleX}
                    cy={node.y * scaleY}
                    r={nodeRadius}
                    fill={
                      isStart
                        ? "hsl(var(--primary))"
                        : isEnd
                          ? "hsl(var(--destructive))"
                          : isInPath
                            ? "hsl(var(--accent))"
                            : "hsl(var(--secondary))"
                    }
                    stroke={
                      isStart || isEnd
                        ? "hsl(var(--primary-foreground))"
                        : isInPath
                          ? "hsl(var(--primary))"
                          : "hsl(var(--border))"
                    }
                    strokeWidth={2}
                    className="transition-all duration-300 cursor-pointer"
                    onClick={() => {
                      if (!startNodeId) {
                        setStartNodeId(node.id)
                      } else if (!endNodeId && node.id !== startNodeId) {
                        setEndNodeId(node.id)
                      } else if (node.id === startNodeId) {
                        setStartNodeId(null)
                      } else if (node.id === endNodeId) {
                        setEndNodeId(null)
                      } else {
                        setStartNodeId(node.id)
                        setEndNodeId(null)
                        setPathResult(null)
                      }
                    }}
                  />
                  <text
                    x={node.x * scaleX}
                    y={node.y * scaleY + nodeRadius + 12}
                    fontSize="12"
                    textAnchor="middle"
                    fill="hsl(var(--foreground))"
                    className="pointer-events-none"
                  >
                    {node.name}
                  </text>
                  {isStart && (
                    <text
                      x={node.x * scaleX}
                      y={node.y * scaleY - nodeRadius - 5}
                      fontSize="10"
                      textAnchor="middle"
                      fill="hsl(var(--primary))"
                      fontWeight="bold"
                    >
                      START
                    </text>
                  )}
                  {isEnd && (
                    <text
                      x={node.x * scaleX}
                      y={node.y * scaleY - nodeRadius - 5}
                      fontSize="10"
                      textAnchor="middle"
                      fill="hsl(var(--destructive))"
                      fontWeight="bold"
                    >
                      END
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </CardContent>
      </Card>
    </div>
  )
}

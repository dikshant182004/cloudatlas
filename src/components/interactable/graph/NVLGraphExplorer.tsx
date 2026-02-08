"use client";

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { 
  GraphData, 
  GraphNode, 
  GraphEdge, 
  getNodeColor, 
  getNodeLabel,
  GRAPH_STYLES 
} from "./graphStyles";
import { cn } from "@/lib/utils";

/**
 * Node Overview Panel Component
 * Shows detailed information about selected node
 */
interface NodeOverviewPanelProps {
  selectedNode: GraphNode | null;
  edges: GraphEdge[];
  onNodeSelect: (node: GraphNode | null) => void;
  onEdgeSelect: (edge: GraphEdge | null) => void;
}

const NodeOverviewPanel: React.FC<NodeOverviewPanelProps> = ({ 
  selectedNode, 
  edges, 
  onNodeSelect,
  onEdgeSelect,
}) => {
  if (!selectedNode) {
    return (
      <div className="w-full bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 p-6 h-full overflow-y-auto">
        <div className="text-gray-400 text-sm">
          Select a node to view details
        </div>
      </div>
    );
  }

  // Count relationships
  const incomingEdges = edges.filter((edge: any) => edge.target === selectedNode.id);
  const outgoingEdges = edges.filter((edge: any) => edge.source === selectedNode.id);

  return (
    <div className="w-full bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 p-6 h-full overflow-y-auto">
      <div className="space-y-4">
        {/* Node Header */}
        <div className="border-b border-gray-700 pb-3 mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: getNodeColor(selectedNode.type) }}
            />
            {selectedNode.label}
          </h3>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            {selectedNode.type}
          </div>
        </div>

        {/* Properties */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Properties</h4>
          {Object.entries(selectedNode.meta || {}).map(([key, value]) => (
            <div key={key} className="flex justify-between py-1">
              <span className="text-xs text-gray-400 capitalize">{key}:</span>
              <span className="text-xs text-gray-200 font-mono">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>

        {/* Relationships */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Relationships</h4>
          
          {incomingEdges.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Incoming ({incomingEdges.length})</div>
              {incomingEdges.map((edge: any, i: any) => (
                <button
                  type="button"
                  key={`${edge.source}-${edge.target}-${edge.type}-${i}`}
                  onClick={() => onEdgeSelect(edge)}
                  className="w-full text-left text-xs bg-gray-800 p-2 rounded border border-gray-700 hover:bg-gray-700/60 transition-colors"
                >
                  <span className="text-blue-400">← {edge.type}</span>
                  <span className="text-gray-300 ml-1">from {edge.source}</span>
                </button>
              ))}
            </div>
          )}

          {outgoingEdges.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Outgoing ({outgoingEdges.length})</div>
              {outgoingEdges.map((edge: any, i: any) => (
                <button
                  type="button"
                  key={`${edge.source}-${edge.target}-${edge.type}-${i}`}
                  onClick={() => onEdgeSelect(edge)}
                  className="w-full text-left text-xs bg-gray-800 p-2 rounded border border-gray-700 hover:bg-gray-700/60 transition-colors"
                >
                  <span className="text-green-400">{edge.type} →</span>
                  <span className="text-gray-300 ml-1">to {edge.target}</span>
                </button>
              ))}
            </div>
          )}

          {incomingEdges.length === 0 && outgoingEdges.length === 0 && (
            <div className="text-xs text-gray-500 italic">
              No relationships
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type GraphExplorerInput =
  | GraphData
  | {
      summary?: string;
      data?: GraphData;
    }
  | {
      summary?: string;
      data?: GraphData[];
    }
  | {
      summary?: string;
      data?: {
        nodes?: GraphNode[];
        edges?: GraphEdge[];
      };
    }
  | null
  | undefined;

function normalizeGraphInput(input: GraphExplorerInput): {
  summary?: string;
  graph: GraphData;
} {
  if (!input) {
    return { graph: { nodes: [], edges: [] } };
  }

  // Shape A: GraphData
  if ("nodes" in input && "edges" in input) {
    return { graph: { nodes: input.nodes ?? [], edges: input.edges ?? [] } };
  }

  const anyInput: any = input as any;
  const summary: string | undefined = typeof anyInput.summary === "string" ? anyInput.summary : undefined;

  // Shape B: { data: GraphData }
  if (anyInput.data && typeof anyInput.data === "object" && Array.isArray(anyInput.data.nodes)) {
    return {
      summary,
      graph: {
        nodes: anyInput.data.nodes ?? [],
        edges: anyInput.data.edges ?? [],
      },
    };
  }

  // Shape C: MCP CloudQueryResult<GraphData> => { data: [ {nodes,edges} ] }
  if (Array.isArray(anyInput.data)) {
    const first = anyInput.data[0];
    if (first && typeof first === "object") {
      return {
        summary,
        graph: {
          nodes: first.nodes ?? [],
          edges: (first.edges ?? []).filter((e: any) => e != null),
        },
      };
    }
  }

  // Shape D: { data: { nodes, edges } }
  if (anyInput.data && typeof anyInput.data === "object") {
    return {
      summary,
      graph: {
        nodes: anyInput.data.nodes ?? [],
        edges: (anyInput.data.edges ?? []).filter((e: any) => e != null),
      },
    };
  }

  return { summary, graph: { nodes: [], edges: [] } };
}

interface NVLGraphExplorerProps {
  data: GraphExplorerInput;
  className?: string;
}

type FocusContext =
  | { type: "node"; node: GraphNode }
  | { type: "edge"; edge: GraphEdge }
  | null;

function explainRelationship(type: string) {
  switch (type) {
    case "ATTACHED_TO":
      return "Indicates this resource is directly attached and may inherit permissions or lifecycle.";
    case "MEMBER_OF":
      return "Shows membership/trust grouping that can affect access or blast radius.";
    case "EXPOSED_VIA":
      return "Represents an exposure path (often internet-facing) that may increase risk.";
    case "MEMBER_OF_VPC":
      return "Indicates this resource is in a VPC; networking boundaries and routing apply.";
    case "MEMBER_OF_EC2_SECURITY_GROUP":
      return "Indicates the instance is governed by a security group; ingress/egress rules apply.";
    default:
      return "Represents a dependency, containment, or access relationship between resources.";
  }
}

export const NVLGraphExplorer: React.FC<NVLGraphExplorerProps> = ({ data, className }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [focusContext, setFocusContext] = useState<FocusContext>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizationRef = useRef<any>(null);

  const normalized = useMemo(() => normalizeGraphInput(data), [data]);
  const nodes = normalized.graph.nodes;
  const edges = normalized.graph.edges;

  const connectedIds = useMemo(() => {
    if (!focusContext) return null;

    if (focusContext.type === "node") {
      const centerId = focusContext.node.id;
      return new Set<string>([
        centerId,
        ...edges
          .filter((e) => e && (e.source === centerId || e.target === centerId))
          .flatMap((e) => [e.source, e.target]),
      ]);
    }

    if (focusContext.type === "edge") {
      return new Set<string>([focusContext.edge.source, focusContext.edge.target]);
    }

    return null;
  }, [focusContext, edges]);

  const focusedGraph = useMemo(() => {
    if (!focusContext) {
      return { nodes, edges };
    }

    if (focusContext.type === "edge") {
      const { source, target, type } = focusContext.edge;
      const nodeIdSet = new Set<string>([source, target]);
      return {
        nodes: nodes.filter((n) => nodeIdSet.has(n.id)),
        edges: edges.filter((e) => e && e.source === source && e.target === target && e.type === type),
      };
    }

    const nodeIdSet = connectedIds ?? new Set<string>([focusContext.node.id]);
    return {
      nodes: nodes.filter((n) => nodeIdSet.has(n.id)),
      edges: edges.filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target)),
    };
  }, [nodes, edges, focusContext, connectedIds]);

  const isGraphReady = useMemo(() => {
    const hasArrays = Array.isArray(nodes) && Array.isArray(edges);
    const hasAnyInput = data != null;
    return hasAnyInput && hasArrays;
  }, [data, nodes, edges]);

  // Re-fit graph when container size changes (chat streaming can change layout height)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const visualization = visualizationRef.current;
    if (!visualization) return;

    const maybeFitView = (visualization as any).fitView;
    const maybeResize = (visualization as any).resize;

    const ro = new ResizeObserver(() => {
      try {
        if (typeof maybeResize === "function") {
          maybeResize.call(visualization);
        }
        if (typeof maybeFitView === "function") {
          maybeFitView.call(visualization);
        }
      } catch {
        // ignore
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [isGraphReady, focusedGraph.nodes.length, focusedGraph.edges.length, selectedNode?.id, selectedEdge?.type, focusContext]);

  // If selected node disappears after refresh, clear selection
  useEffect(() => {
    if (!selectedNode) return;
    const stillExists = nodes.some((n) => n.id === selectedNode.id);
    if (!stillExists) {
      setSelectedNode(null);
      setSelectedEdge(null);
      setFocusContext(null);
    }
  }, [nodes, selectedNode]);

  const handleSelectNodeById = useCallback(
    (nodeId: string | null) => {
      if (!nodeId) return;
      const graphNode = nodes.find((n) => n.id === nodeId) || null;
      if (!graphNode) return;
      setSelectedNode(graphNode);
      setFocusContext({ type: "node", node: graphNode });
      setSelectedEdge(null);
    },
    [nodes]
  );

  const handleSelectEdge = useCallback(
    (edge: GraphEdge | null) => {
      if (!edge) return;
      setSelectedEdge(edge);
      setFocusContext({ type: "edge", edge });
      const targetNode = nodes.find((n) => n.id === edge.target) || null;
      setSelectedNode(targetNode);
    },
    [nodes]
  );

  // Initialize NVL visualization (per NVL docs: container element, nodes array, relationships array)
  useEffect(() => {
    if (!isGraphReady) return;
    if (renderError) return;
    const container = containerRef.current;
    if (!container) return;

    // Basic WebGL capability check (prevents hard crashes on some devices/browsers)
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      if (!gl) {
        setRenderError("WebGL is not available in this browser/environment.");
        return;
      }
    } catch {
      setRenderError("WebGL initialization failed.");
      return;
    }

    // Always destroy previous instance before creating a new one
    if (visualizationRef.current) {
      try {
        visualizationRef.current.destroy?.();
      } catch {
        // ignore
      }
      visualizationRef.current = null;
    }

    // Clear container to avoid stacked canvases / duplicated renderers
    container.innerHTML = "";

    if (focusedGraph.nodes.length === 0) return;

    let disposed = false;

    import("@neo4j-nvl/base")
      .then((nvlModule: any) => {
        if (disposed) return;

        const NVLClass = nvlModule?.NVL;
        if (!NVLClass) return;

        const selectedNodeId =
          focusContext?.type === "node"
            ? focusContext.node.id
            : focusContext?.type === "edge"
              ? focusContext.edge.source
              : selectedNode?.id ?? null;

        const selectedEdgeId =
          focusContext?.type === "edge"
            ? `${focusContext.edge.source}-${focusContext.edge.target}-${focusContext.edge.type}`
            : selectedEdge
              ? `${selectedEdge.source}-${selectedEdge.target}-${selectedEdge.type}`
              : null;

        const connectedNodeIds = connectedIds;

        const nvlNodes = focusedGraph.nodes.map((node) => {
          const isSelected = selectedNodeId != null && node.id === selectedNodeId;
          const isConnected = connectedNodeIds ? connectedNodeIds.has(node.id) : false;
          const dimmed = connectedNodeIds != null && !isConnected;
          const isHovered = focusContext == null && hoveredNodeId != null && node.id === hoveredNodeId;
          const baseColor = getNodeColor(node.type);

          return {
            id: node.id,
            labels: [node.type],
            caption: getNodeLabel(node),
            color: dimmed ? GRAPH_STYLES.NODE_DIM_COLOR : baseColor,
            size: isSelected
              ? GRAPH_STYLES.NODE_SELECTED_RADIUS
              : isHovered
                ? GRAPH_STYLES.NODE_HOVER_RADIUS
              : isConnected
                ? GRAPH_STYLES.NODE_HOVER_RADIUS
                : GRAPH_STYLES.NODE_RADIUS,
            opacity: dimmed ? 0.2 : 1,
            properties: node.meta || {},
          };
        });

        const nvlRelationships = focusedGraph.edges
          .filter((e) => e && e.source && e.target)
          .map((edge) => {
            const id = `${edge.source}-${edge.target}-${edge.type}`;
            const isSelected = selectedEdgeId != null && id === selectedEdgeId;
            const isConnectedToSelectedNode = connectedNodeIds
              ? connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target)
              : false;

            const dimmed = connectedNodeIds != null && !isConnectedToSelectedNode;

            return {
              id,
              from: edge.source,
              to: edge.target,
              type: edge.type,
              color: dimmed
                ? GRAPH_STYLES.EDGE_DIM_COLOR
                : isSelected
                  ? GRAPH_STYLES.EDGE_SELECTED_COLOR
                  : isConnectedToSelectedNode
                    ? GRAPH_STYLES.EDGE_HOVER_COLOR
                    : GRAPH_STYLES.EDGE_COLOR,
              width: isSelected
                ? GRAPH_STYLES.EDGE_SELECTED_WIDTH
                : isConnectedToSelectedNode
                  ? GRAPH_STYLES.EDGE_HOVER_WIDTH
                  : GRAPH_STYLES.EDGE_WIDTH,
              opacity: dimmed ? 0.15 : 1,
              properties: edge.meta || {},
            };
          });

        let visualization: any;
        try {
          visualization = new NVLClass(container, nvlNodes, nvlRelationships);
        } catch (e: any) {
          setRenderError(
            typeof e?.message === "string"
              ? e.message
              : "Graph renderer failed to initialize.",
          );
          return;
        }

        visualizationRef.current = visualization;

        // Optional: if hit-testing is available, allow click-to-select on graph.
        const maybeGetHits = (visualization as any).getHits;
        if (typeof maybeGetHits === "function") {
          const handleClick = (evt: MouseEvent) => {
            const hits = maybeGetHits.call(visualization, evt, ["node", "relationship"]);

            const hitNode = hits?.nvlTargets?.nodes?.[0];
            const hitRel = hits?.nvlTargets?.relationships?.[0];

            if (hitRel && typeof hitRel.id === "string") {
              const edge = edges.find((e) => `${e.source}-${e.target}-${e.type}` === hitRel.id) || null;
              if (edge) {
                handleSelectEdge(edge);
                return;
              }
            }

            const hitId = typeof hitNode?.id === "string" ? hitNode.id : null;
            if (hitId) {
              handleSelectNodeById(hitId);
            }
          };

          const handleMouseMove = (evt: MouseEvent) => {
            if (focusContext != null) return;
            const hits = maybeGetHits.call(visualization, evt, ["node"]);
            const hitNode = hits?.nvlTargets?.nodes?.[0];
            const hitId = typeof hitNode?.id === "string" ? hitNode.id : null;
            setHoveredNodeId((prev) => (prev === hitId ? prev : hitId));
          };

          const handleMouseLeave = () => {
            if (focusContext != null) return;
            setHoveredNodeId(null);
          };

          container.addEventListener("click", handleClick);
          container.addEventListener("mousemove", handleMouseMove);
          container.addEventListener("mouseleave", handleMouseLeave);

          (visualization as any).__nvlGraphExplorerCleanup = () => {
            container.removeEventListener("click", handleClick);
            container.removeEventListener("mousemove", handleMouseMove);
            container.removeEventListener("mouseleave", handleMouseLeave);
          };
        }

        // Optional: fit graph if supported
        const maybeFitView = (visualization as any).fitView;
        if (typeof maybeFitView === "function") {
          setTimeout(() => {
            try {
              maybeFitView.call(visualization);
            } catch {
              // ignore
            }
          }, 0);
        }
      })
      .catch(() => {
        setRenderError("Failed to load graph renderer.");
      });

    return () => {
      disposed = true;
      const viz = visualizationRef.current;
      if (viz) {
        try {
          (viz as any).__nvlGraphExplorerCleanup?.();
        } catch {
          // ignore
        }
        try {
          viz.destroy?.();
        } catch {
          // ignore
        }
      }
      visualizationRef.current = null;
    };
  }, [isGraphReady, focusedGraph, nodes, edges, selectedNode?.id, selectedEdge?.source, selectedEdge?.target, selectedEdge?.type, handleSelectNodeById, handleSelectEdge, focusContext, connectedIds]);

  // Reset view handler
  const handleResetView = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setFocusContext(null);
    setHoveredNodeId(null);
    const visualization = visualizationRef.current;
    if (visualization) {
      try {
        // Use the correct fitView method
        if (typeof (visualization as any).fitView === 'function') {
          (visualization as any).fitView();
        }
      } catch (error) {
        console.error("Error resetting view:", error);
      }
    }
  }, []);

  return (
    <div className={cn("relative w-full bg-gray-950 flex flex-col md:flex-row", className)}>
      {/* Canvas Container - takes remaining space */}
      <div className="flex-1 relative min-h-[420px] md:min-h-0 md:h-full">
        <div
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ background: "#030712", touchAction: "none", userSelect: "none" }}
          tabIndex={0}
        />

        {renderError && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-lg border border-gray-700 bg-gray-900/90 p-4 text-sm text-gray-200">
              <div className="font-medium mb-1">Graph unavailable</div>
              <div className="text-gray-400 break-words">{renderError}</div>
            </div>
          </div>
        )}

        {!isGraphReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-400 text-sm">Loading graph…</div>
          </div>
        )}
        
        {/* Reset View Button */}
        <button
          onClick={handleResetView}
          className="absolute top-4 left-4 z-10 px-3 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700 transition-colors border border-gray-600"
        >
          Reset View
        </button>

        {focusContext && (
          <div className="absolute bottom-4 left-4 z-20 bg-gray-900/95 border border-gray-700 rounded-md px-3 py-2 max-w-xs max-h-40 overflow-y-auto shadow-xl">
            {focusContext.type === "node" ? (
              (() => {
                const node = focusContext.node;
                const incomingCount = edges.filter((e) => e && e.target === node.id).length;
                const outgoingCount = edges.filter((e) => e && e.source === node.id).length;
                return (
                  <>
                    <div className="text-xs font-semibold text-white truncate">{node.label}</div>
                    <div className="text-[11px] text-gray-400">{node.type}</div>
                    <div className="text-[11px] text-gray-400 mt-1 mb-1">
                      Incoming: <span className="text-gray-200">{incomingCount}</span> · Outgoing:{" "}
                      <span className="text-gray-200">{outgoingCount}</span>
                    </div>
                    <div className="text-[11px] text-gray-300">
                      {Object.entries(node.meta || {})
                        .slice(0, 3)
                        .map(([k, v]) => (
                          <div key={k}>
                            <span className="text-gray-400">{k}:</span>{" "}
                            <span className="font-mono">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                          </div>
                        ))}
                    </div>
                  </>
                );
              })()
            ) : (
              <>
                <div className="text-xs font-semibold text-white truncate">Relationship: {focusContext.edge.type}</div>
                <div className="text-[11px] text-gray-400 mt-1 break-all">
                  {focusContext.edge.source} {"→"} {focusContext.edge.target}
                </div>
                <div className="text-[11px] text-gray-300 mt-1">{explainRelationship(focusContext.edge.type)}</div>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {isGraphReady && nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-400 text-sm">No graph data to display</div>
          </div>
        )}
      </div>

      {/* Node Overview Panel - fixed width, no overflow issues */}
      <div className="w-full md:w-80 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 p-4 md:p-6 h-[360px] md:h-full overflow-y-auto flex-shrink-0">
        {/* Quick node picker (works even if NVL hit testing isn't available) */}
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">
            Nodes ({nodes.length}) / Edges ({edges.length})
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {nodes.slice(0, 200).map((n) => (
              <button
                key={n.id}
                onClick={() => handleSelectNodeById(n.id)}
                className={cn(
                  "w-full text-left text-xs px-2 py-1 rounded border transition-colors",
                  selectedNode?.id === n.id
                    ? "bg-gray-700/60 border-gray-600 text-white"
                    : "bg-gray-800/40 border-gray-700 text-gray-200 hover:bg-gray-800/70"
                )}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: getNodeColor(n.type) }} />
                <span className="font-mono">{getNodeLabel(n)}</span>
              </button>
            ))}
          </div>
          {nodes.length > 200 && (
            <div className="text-[11px] text-gray-500 mt-2">Showing first 200 nodes</div>
          )}
        </div>
        <NodeOverviewPanel 
          selectedNode={selectedNode} 
          edges={edges} 
          onNodeSelect={(n) => {
            setSelectedNode(n);
            setSelectedEdge(null);
          }}
          onEdgeSelect={handleSelectEdge}
        />
      </div>
    </div>
  );
};

export default NVLGraphExplorer;

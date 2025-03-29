import { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeTypes,
  EdgeTypes,
  Panel,
  BackgroundVariant,
  getBezierPath,
  EdgeProps,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { WorkPlan, NodeData, ExtendedNode, CommitStatus } from '../types';
import { 
  convertWorkPlanToFlow, 
  filterWorkplan,
  filterNodesAndEdges
} from '../utils/workplanConverter';
import { useResponsiveFlowDimensions } from '../utils/responsiveUtils';
import CommitNode from './CommitNode';
import { FilterOptions } from '../components/FilterPanel';
import './nodes/nodes.css';

export interface WorkplanFlowProps {
  workplan: WorkPlan;
  filterOptions: FilterOptions;
}

// Custom edge component
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  animated
}: EdgeProps) => {
  // Adjust connection point calculation
  // Ensure targetPosition is set to Position.Left
  const targetPos = targetPosition || Position.Left;
  const sourcePos = sourcePosition || Position.Right;
  
  // Adjust arguments for getBezierPath
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePos,
    targetX,
    targetY,
    targetPosition: targetPos,
    curvature: 0.4
  });

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: style.strokeWidth || 2,
          stroke: style.stroke || '#555',
          transition: 'stroke 0.3s, stroke-width 0.3s',
        }}
        className={`react-flow__edge-path ${animated ? 'animated' : ''}`}
        d={edgePath}
        markerEnd={markerEnd}
      />
      {data?.label && (
        <text
          x={labelX}
          y={labelY}
          style={{
            fontSize: '10px',
            fill: '#666',
            textAnchor: 'middle',
            dominantBaseline: 'middle',
            pointerEvents: 'none',
            fontWeight: 'normal',
          }}
          className="react-flow__edge-text"
        >
          {data.label}
        </text>
      )}
    </>
  );
};

// Register custom node types
const nodeTypes: NodeTypes = {
  commitNode: CommitNode,
};

// Register custom edge types
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

// Status label definitions
const statusLabels: Record<CommitStatus, string> = {
  'not_started': 'Not Started',
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'needsRefinment': 'Needs Refinement',
  'user_review': 'Awaiting User Review'
};


const WorkplanFlow = ({ 
  workplan, 
  filterOptions
}: WorkplanFlowProps) => {
  // Default filter options
  const defaultFilterOptions: FilterOptions = {
    statusFilter: 'all',
    searchQuery: '',
    onlyShowActive: false
  };
  
  // Get responsive settings
  const {
    miniMapVisible,
    controlsStyle,
    miniMapStyle,
    currentBreakpoint
  } = useResponsiveFlowDimensions();
  
  // Use provided filter options or default
  const activeFilterOptions = filterOptions || defaultFilterOptions;
  
  // Apply filtering
  const filteredWorkplan = useMemo(() => {
    return filterWorkplan(workplan, activeFilterOptions);
  }, [workplan, activeFilterOptions]);

  // Set initial nodes and edges (generated from filtered workplan)
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return convertWorkPlanToFlow(filteredWorkplan);
  }, [filteredWorkplan]);
  
  // Add callbacks to commit nodes
  const nodesWithCallbacks = useMemo(() => {
    return initialNodes.map(node => {
      if (node.type === 'commitNode') {
        const nodeData = node.data as any; // Temporarily handle as any
        return {
          ...node,
          data: {
            ...nodeData,
            // Fallback if data doesn't have necessary properties
            title: nodeData.title || nodeData.label || '',
            status: nodeData.status || 'not_started'
          }
        };
      }
      return node;
    });
  }, [initialNodes]);
  
  // Change edge type to custom
  const customEdges = useMemo(() => {
    return initialEdges.map(edge => ({
      ...edge,
      type: 'custom',
      data: { label: edge.label },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.style?.stroke || '#555',
      },
    }));
  }, [initialEdges]);
  
  // Apply filtering directly to nodes and edges
  const { nodes: filteredNodes, edges: filteredEdges } = useMemo(() => {
    return filterNodesAndEdges(nodesWithCallbacks, customEdges, activeFilterOptions);
  }, [nodesWithCallbacks, customEdges, activeFilterOptions]);
  
  // Use handlers for interaction only
  const [, , onNodesChange] = useNodesState([]);
  const [, , onEdgesChange] = useEdgesState([]);
  
  // Selected node information
  const [selectedNode, setSelectedNode] = useState<ExtendedNode<NodeData> | null>(null);

  // Handler for node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: ExtendedNode) => {
    setSelectedNode(node as ExtendedNode<NodeData>);
  }, []);
  
  // Handler for canvas click (deselection)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);
  
  // Flow component style
  const proOptions = { hideAttribution: true };

  // FitView options based on current breakpoint
  const fitViewOptions = useMemo(() => ({
    padding: currentBreakpoint === 'xs' ? 0.1 : 
             currentBreakpoint === 'sm' ? 0.15 : 0.2,
    maxZoom: 1.5,
    includeHiddenNodes: false,
    minZoom: 0.2,
    alignmentX: 0.5,  // Horizontal center
    alignmentY: 0,    // Top alignment
  }), [currentBreakpoint]);

  // Initial viewport settings
  const defaultViewport = { x: 0, y: 0, zoom: 1 };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        defaultViewport={defaultViewport}
        proOptions={proOptions}
        minZoom={0.1}
        maxZoom={2}
      >
        {/* Display active filters - responsive */}
        {(activeFilterOptions.statusFilter !== 'all' || 
          activeFilterOptions.searchQuery.trim() || 
          activeFilterOptions.onlyShowActive) && (
          <Panel 
            position="top-left" 
            className={`bg-white p-2 rounded-lg shadow-md border border-gray-200 ${
              currentBreakpoint === 'xs' ? 'text-xs max-w-[80vw]' : ''
            }`}
          >
            <div className={`text-gray-700 ${currentBreakpoint === 'xs' ? 'text-xs' : 'text-sm'}`}>
              <span className="font-bold">Filters Applied:</span>
              <div className={`flex flex-wrap gap-1 mt-1 ${currentBreakpoint === 'xs' ? 'max-w-full' : ''}`}>
                {activeFilterOptions.statusFilter !== 'all' && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Status: {activeFilterOptions.statusFilter}
                  </span>
                )}
                {activeFilterOptions.searchQuery.trim() && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                    Search: {activeFilterOptions.searchQuery}
                  </span>
                )}
                {activeFilterOptions.onlyShowActive && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    Active Only
                  </span>
                )}
              </div>
            </div>
          </Panel>
        )}
        
        {/* Mini map - responsive */}
        {miniMapVisible && (
          <MiniMap 
            style={miniMapStyle}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
        )}
        
        {/* Controls - responsive */}
        <Controls style={controlsStyle} />
        
        <Background
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
        />
        
        {/* Help information for mobile display */}
        {currentBreakpoint === 'xs' && (
          <Panel position="bottom-center" className="p-2 bg-white bg-opacity-80 rounded text-xs text-center">
            Pinch to zoom, swipe to move
          </Panel>
        )}
      </ReactFlow>
      
      {/* Detailed information for selected node - responsive */}
      {selectedNode && (
        <div 
          className={`absolute p-3 bg-white dark:bg-gray-800 border rounded-md shadow-lg 
            ${currentBreakpoint === 'xs' ? 'left-2 right-2 bottom-2' : 'right-4 top-4 w-64'}`}
        >
          <div className="flex justify-between mb-2">
            <h3 className="font-bold">Details</h3>
            <button 
              onClick={onPaneClick}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="text-sm">
            <p><strong>Title:</strong> {selectedNode.data.label}</p>
            <p><strong>Status:</strong> {selectedNode.data.status && statusLabels[selectedNode.data.status]}</p>
            {selectedNode.data.description && (
              <p><strong>Description:</strong> {selectedNode.data.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkplanFlow; 
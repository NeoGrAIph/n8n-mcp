import { Workflow, WorkflowConnection, WorkflowNode } from '../types/n8n-api';
import { isTriggerNode } from '../utils/node-type-utils';

export type SubWorkflowMode = 'full' | 'node' | 'subgraph';

export interface SubWorkflowBuildInput {
  workflow: Workflow;
  mode: SubWorkflowMode;
  targetNodeName?: string;
  startNodeName?: string;
  endNodeNames?: string[];
  includeUpstream?: boolean;
  includeDownstream?: boolean;
}

export interface SubWorkflowBuildResult {
  workflow: Workflow;
  selectedNodeNames: string[];
  warnings: string[];
  triggerNodeName: string;
}

interface WorkflowGraph {
  nodeByName: Map<string, WorkflowNode>;
  outEdges: Map<string, Set<string>>;
  inEdges: Map<string, Set<string>>;
}

function buildGraph(workflow: Workflow): WorkflowGraph {
  const nodeByName = new Map<string, WorkflowNode>();
  const outEdges = new Map<string, Set<string>>();
  const inEdges = new Map<string, Set<string>>();

  workflow.nodes.forEach(node => {
    nodeByName.set(node.name, node);
  });

  const connections = workflow.connections || {};
  for (const [sourceName, outputs] of Object.entries(connections)) {
    if (!nodeByName.has(sourceName)) {
      continue;
    }
    for (const [, connectionGroups] of Object.entries(outputs || {})) {
      if (!Array.isArray(connectionGroups)) {
        continue;
      }
      for (const group of connectionGroups) {
        if (!Array.isArray(group)) {
          continue;
        }
        for (const connection of group) {
          if (!connection?.node || !nodeByName.has(connection.node)) {
            continue;
          }
          if (!outEdges.has(sourceName)) {
            outEdges.set(sourceName, new Set());
          }
          if (!inEdges.has(connection.node)) {
            inEdges.set(connection.node, new Set());
          }
          outEdges.get(sourceName)!.add(connection.node);
          inEdges.get(connection.node)!.add(sourceName);
        }
      }
    }
  }

  return { nodeByName, outEdges, inEdges };
}

function collectUpstream(startNodes: Iterable<string>, inEdges: Map<string, Set<string>>): Set<string> {
  const visited = new Set<string>();
  const queue: string[] = [];

  for (const node of startNodes) {
    queue.push(node);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    const parents = inEdges.get(current);
    if (!parents) {
      continue;
    }
    for (const parent of parents) {
      if (!visited.has(parent)) {
        queue.push(parent);
      }
    }
  }

  return visited;
}

function collectDownstream(
  startNodes: Iterable<string>,
  outEdges: Map<string, Set<string>>,
  endNodes?: Set<string>
): Set<string> {
  const visited = new Set<string>();
  const queue: string[] = [];

  for (const node of startNodes) {
    queue.push(node);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    if (endNodes && endNodes.has(current)) {
      continue;
    }
    const children = outEdges.get(current);
    if (!children) {
      continue;
    }
    for (const child of children) {
      if (!visited.has(child)) {
        queue.push(child);
      }
    }
  }

  return visited;
}

function filterConnections(connections: WorkflowConnection, selected: Set<string>): WorkflowConnection {
  const filtered: WorkflowConnection = {};

  for (const [sourceName, outputs] of Object.entries(connections || {})) {
    if (!selected.has(sourceName)) {
      continue;
    }

    const nextOutputs: Record<string, Array<Array<{ node: string; type: string; index: number }>>> = {};
    for (const [outputType, groups] of Object.entries(outputs || {})) {
      if (!Array.isArray(groups)) {
        continue;
      }
      const keptGroups = groups
        .map(group => (Array.isArray(group) ? group.filter(conn => conn && selected.has(conn.node)) : []))
        .filter(group => group.length > 0);
      if (keptGroups.length > 0) {
        nextOutputs[outputType] = keptGroups;
      }
    }

    if (Object.keys(nextOutputs).length > 0) {
      filtered[sourceName] = nextOutputs;
    }
  }

  return filtered;
}

function getRootNodes(selected: Set<string>, inEdges: Map<string, Set<string>>): string[] {
  const roots: string[] = [];
  for (const node of selected) {
    const parents = inEdges.get(node);
    const hasIncoming = parents ? Array.from(parents).some(parent => selected.has(parent)) : false;
    if (!hasIncoming) {
      roots.push(node);
    }
  }
  return roots;
}

function createExecuteWorkflowTrigger(existingNames: Set<string>): WorkflowNode {
  const baseName = 'MCP Execute Workflow Trigger';
  let name = baseName;
  let suffix = 1;
  while (existingNames.has(name)) {
    name = `${baseName} ${suffix}`;
    suffix += 1;
  }

  return {
    id: 'mcp-execute-workflow-trigger',
    name,
    type: 'n8n-nodes-base.executeWorkflowTrigger',
    typeVersion: 1.1,
    position: [-320, 0],
    parameters: {
      inputSource: 'passthrough',
    },
  };
}

const NODE_REFERENCE_REGEX = /\$node\[['"]([^'"]+)['"]\]/g;

function collectNodeReferences(value: unknown, references: Set<string>): void {
  if (typeof value === 'string') {
    let match: RegExpExecArray | null;
    while ((match = NODE_REFERENCE_REGEX.exec(value)) !== null) {
      if (match[1]) {
        references.add(match[1]);
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(entry => collectNodeReferences(entry, references));
    return;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (record.__rl && typeof record.value === 'string') {
      collectNodeReferences(record.value, references);
    }
    Object.values(record).forEach(entry => collectNodeReferences(entry, references));
  }
}

function applyExpressionReferences(
  selected: Set<string>,
  graph: WorkflowGraph,
  includeUpstream: boolean,
  warnings: string[]
): void {
  const referenced = new Set<string>();

  for (const nodeName of selected) {
    const node = graph.nodeByName.get(nodeName);
    if (!node) {
      continue;
    }
    collectNodeReferences(node.parameters, referenced);
  }

  for (const refName of referenced) {
    if (selected.has(refName)) {
      continue;
    }
    if (!graph.nodeByName.has(refName)) {
      warnings.push(`Expression references missing node "${refName}"`);
      continue;
    }
    if (includeUpstream) {
      const upstream = collectUpstream([refName], graph.inEdges);
      upstream.forEach(name => selected.add(name));
    } else {
      warnings.push(`Expression references node "${refName}" outside selected subgraph`);
    }
  }
}

export function buildSubWorkflow(input: SubWorkflowBuildInput): SubWorkflowBuildResult {
  const warnings: string[] = [];
  const { workflow, mode, targetNodeName, startNodeName, endNodeNames, includeUpstream, includeDownstream } = input;

  const graph = buildGraph(workflow);
  const selected = new Set<string>();

  const endNodesSet = endNodeNames && endNodeNames.length > 0 ? new Set(endNodeNames) : undefined;

  if (mode === 'full') {
    workflow.nodes.forEach(node => selected.add(node.name));
  } else if (mode === 'node') {
    if (targetNodeName) {
      selected.add(targetNodeName);
    }
    if (includeUpstream) {
      collectUpstream(selected, graph.inEdges).forEach(name => selected.add(name));
    }
    if (includeDownstream) {
      const downstreamStart = targetNodeName ? [targetNodeName] : selected;
      collectDownstream(downstreamStart, graph.outEdges).forEach(name => selected.add(name));
    }
  } else {
    if (startNodeName) {
      selected.add(startNodeName);
      if (includeUpstream) {
        collectUpstream(selected, graph.inEdges).forEach(name => selected.add(name));
      }
      if (includeDownstream) {
        collectDownstream([startNodeName], graph.outEdges, endNodesSet).forEach(name => selected.add(name));
      }
    } else if (targetNodeName) {
      selected.add(targetNodeName);
      if (includeUpstream) {
        collectUpstream(selected, graph.inEdges).forEach(name => selected.add(name));
      }
      if (includeDownstream) {
        collectDownstream([targetNodeName], graph.outEdges, endNodesSet).forEach(name => selected.add(name));
      }
    }
  }

  const removedTriggers: string[] = [];
  for (const nodeName of Array.from(selected)) {
    const node = graph.nodeByName.get(nodeName);
    if (node && isTriggerNode(node.type)) {
      selected.delete(nodeName);
      removedTriggers.push(nodeName);
    }
  }
  if (removedTriggers.length > 0) {
    warnings.push(`Removed trigger nodes from sub-workflow: ${removedTriggers.join(', ')}`);
  }

  if (selected.size === 0) {
    throw new Error('Selected subgraph is empty after filtering trigger nodes');
  }

  applyExpressionReferences(selected, graph, !!includeUpstream, warnings);

  for (const nodeName of Array.from(selected)) {
    const node = graph.nodeByName.get(nodeName);
    if (node && isTriggerNode(node.type)) {
      selected.delete(nodeName);
    }
  }

  if (selected.size === 0) {
    throw new Error('Selected subgraph is empty after applying expression references');
  }

  const selectedNodes = workflow.nodes
    .filter(node => selected.has(node.name))
    .map(node => {
      if (targetNodeName && node.name === targetNodeName) {
        return { ...node, disabled: false };
      }
      return { ...node };
    });

  const connections = filterConnections(workflow.connections || {}, selected);
  const roots = getRootNodes(selected, graph.inEdges);

  const existingNames = new Set<string>(selectedNodes.map(node => node.name));
  const triggerNode = createExecuteWorkflowTrigger(existingNames);

  const rootTargets = roots.length > 0 ? roots : [targetNodeName || selectedNodes[0].name];
  if (roots.length === 0) {
    warnings.push('No root nodes detected in subgraph; connected trigger to fallback node');
  }

  connections[triggerNode.name] = {
    main: [
      rootTargets.map(nodeName => ({
        node: nodeName,
        type: 'main',
        index: 0,
      })),
    ],
  };

  const subWorkflowNameParts = [`MCP Code Test: ${workflow.name}`];
  if (targetNodeName) {
    subWorkflowNameParts.push(targetNodeName);
  }
  if (mode !== 'node') {
    subWorkflowNameParts.push(`[${mode}]`);
  }

  return {
    workflow: {
      name: subWorkflowNameParts.join(' / '),
      nodes: [triggerNode, ...selectedNodes],
      connections,
      settings: {
        executionOrder: workflow.settings?.executionOrder || 'v1',
      },
      staticData: {},
    },
    selectedNodeNames: selectedNodes.map(node => node.name),
    warnings,
    triggerNodeName: triggerNode.name,
  };
}

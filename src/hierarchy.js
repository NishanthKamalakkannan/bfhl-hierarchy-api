const EDGE_PATTERN = /^([A-Z])->([A-Z])$/;

function parseAndClassifyEntries(entries) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const parsedEdges = [];
  const seenEdges = new Set();
  const duplicateRecorded = new Set();
  const assignedChildParent = new Map();

  for (const rawEntry of entries) {
    const entry = typeof rawEntry === "string" ? rawEntry.trim() : "";
    const match = EDGE_PATTERN.exec(entry);

    if (!entry || !match) {
      invalidEntries.push(typeof rawEntry === "string" ? rawEntry : String(rawEntry ?? ""));
      continue;
    }

    const [, parent, child] = match;
    if (parent === child) {
      invalidEntries.push(typeof rawEntry === "string" ? rawEntry : String(rawEntry ?? ""));
      continue;
    }

    const normalizedEdge = `${parent}->${child}`;

    if (seenEdges.has(normalizedEdge)) {
      if (!duplicateRecorded.has(normalizedEdge)) {
        duplicateEdges.push(normalizedEdge);
        duplicateRecorded.add(normalizedEdge);
      }
      continue;
    }
    seenEdges.add(normalizedEdge);

    // First parent encountered for a child wins (as required).
    if (assignedChildParent.has(child)) {
      continue;
    }

    assignedChildParent.set(child, parent);
    parsedEdges.push({ parent, child });
  }

  return {
    invalidEntries,
    duplicateEdges,
    parsedEdges,
  };
}

function buildAdjacency(parsedEdges) {
  const adjacency = new Map();
  const allNodes = new Set();
  const indegree = new Map();

  for (const { parent, child } of parsedEdges) {
    allNodes.add(parent);
    allNodes.add(child);

    if (!adjacency.has(parent)) adjacency.set(parent, []);
    if (!adjacency.has(child)) adjacency.set(child, []);

    adjacency.get(parent).push(child);
    indegree.set(child, (indegree.get(child) ?? 0) + 1);
    if (!indegree.has(parent)) indegree.set(parent, 0);
  }

  for (const node of adjacency.keys()) {
    adjacency.get(node).sort();
  }

  return { adjacency, allNodes, indegree };
}

function undirectedComponents(adjacency, allNodes) {
  const undirected = new Map();
  for (const node of allNodes) {
    undirected.set(node, new Set());
  }

  for (const [parent, children] of adjacency.entries()) {
    for (const child of children) {
      undirected.get(parent).add(child);
      undirected.get(child).add(parent);
    }
  }

  const visited = new Set();
  const components = [];

  for (const node of allNodes) {
    if (visited.has(node)) continue;
    const stack = [node];
    const members = [];
    visited.add(node);

    while (stack.length) {
      const current = stack.pop();
      members.push(current);
      for (const neighbor of undirected.get(current)) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        stack.push(neighbor);
      }
    }

    members.sort();
    components.push(members);
  }

  return components;
}

function detectCycleFromRoot(root, adjacency, allowedSet) {
  const seen = new Set();
  const inStack = new Set();

  function dfs(node) {
    seen.add(node);
    inStack.add(node);

    for (const next of adjacency.get(node) ?? []) {
      if (!allowedSet.has(next)) continue;
      if (!seen.has(next)) {
        if (dfs(next)) return true;
      } else if (inStack.has(next)) {
        return true;
      }
    }

    inStack.delete(node);
    return false;
  }

  return dfs(root);
}

function buildTreeObject(root, adjacency, allowedSet) {
  function rec(node) {
    const children = (adjacency.get(node) ?? []).filter((n) => allowedSet.has(n));
    const nestedChildren = {};
    for (const child of children) {
      nestedChildren[child] = rec(child);
    }
    return nestedChildren;
  }

  return { [root]: rec(root) };
}

function depthFromRoot(root, adjacency, allowedSet) {
  function rec(node) {
    const children = (adjacency.get(node) ?? []).filter((n) => allowedSet.has(n));
    if (children.length === 0) return 1;

    let maxChildDepth = 0;
    for (const child of children) {
      const d = rec(child);
      if (d > maxChildDepth) maxChildDepth = d;
    }
    return 1 + maxChildDepth;
  }

  return rec(root);
}

function buildHierarchies(parsedEdges) {
  const { adjacency, allNodes, indegree } = buildAdjacency(parsedEdges);
  if (allNodes.size === 0) {
    return { hierarchies: [], totalTrees: 0, totalCycles: 0, largestTreeRoot: "" };
  }

  const components = undirectedComponents(adjacency, allNodes);
  const hierarchies = [];
  let totalTrees = 0;
  let totalCycles = 0;
  let largestTreeRoot = "";
  let largestDepth = -1;

  for (const componentNodes of components) {
    const allowedSet = new Set(componentNodes);
    const roots = componentNodes.filter((node) => (indegree.get(node) ?? 0) === 0).sort();
    const root = roots.length > 0 ? roots[0] : componentNodes[0];
    const hasCycle = detectCycleFromRoot(root, adjacency, allowedSet);

    if (hasCycle) {
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
      totalCycles += 1;
      continue;
    }

    const tree = buildTreeObject(root, adjacency, allowedSet);
    const depth = depthFromRoot(root, adjacency, allowedSet);
    hierarchies.push({
      root,
      tree,
      depth,
    });
    totalTrees += 1;

    if (depth > largestDepth || (depth === largestDepth && root < largestTreeRoot)) {
      largestDepth = depth;
      largestTreeRoot = root;
    }
  }

  hierarchies.sort((a, b) => a.root.localeCompare(b.root));

  return {
    hierarchies,
    totalTrees,
    totalCycles,
    largestTreeRoot,
  };
}

function processHierarchyPayload(data) {
  const safeData = Array.isArray(data) ? data : [];
  const { invalidEntries, duplicateEdges, parsedEdges } = parseAndClassifyEntries(safeData);
  const { hierarchies, totalTrees, totalCycles, largestTreeRoot } = buildHierarchies(parsedEdges);

  return {
    hierarchies,
    invalidEntries,
    duplicateEdges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestTreeRoot,
    },
  };
}

module.exports = {
  processHierarchyPayload,
};

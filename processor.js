"use strict";

/**
 * Validates a single trimmed entry against the X->Y format.
 * X and Y must each be a single uppercase letter A-Z, and X !== Y (no self-loop).
 */
const EDGE_RE = /^([A-Z])->([A-Z])$/;

function processData(rawData) {
  const data = Array.isArray(rawData) ? rawData : [];

  const invalid_entries = [];
  const duplicate_edges = [];

  // First-occurrence edges in input order
  const edges = [];                 // [{ parent, child }]
  const seenEdge = new Set();       // "P->C" already accepted
  const seenDuplicate = new Set();  // dedupe the duplicate_edges list itself

  for (const original of data) {
    // Non-strings are invalid as-is
    if (typeof original !== "string") {
      invalid_entries.push(original);
      continue;
    }

    const entry = original.trim();
    const m = entry.match(EDGE_RE);

    if (!m) {
      // Push the ORIGINAL string (spec example trims then validates,
      // but reports the offending input). We report trimmed for consistency
      // with the validation we ran; spec examples use already-clean tokens.
      invalid_entries.push(original);
      continue;
    }

    const parent = m[1];
    const child = m[2];

    if (parent === child) {
      // Self-loop A->A is invalid
      invalid_entries.push(original);
      continue;
    }

    const key = `${parent}->${child}`;
    if (seenEdge.has(key)) {
      // Duplicate edge — record once regardless of repeat count
      if (!seenDuplicate.has(key)) {
        duplicate_edges.push(key);
        seenDuplicate.add(key);
      }
      continue;
    }

    seenEdge.add(key);
    edges.push({ parent, child });
  }

  // ---- Build parent map honoring "first parent wins" for multi-parent children
  // childToParent: first encountered parent for each child
  const childToParent = new Map();
  const childrenOf = new Map();      // parent -> [children] (only accepted edges)
  const allNodes = new Set();

  for (const { parent, child } of edges) {
    allNodes.add(parent);
    allNodes.add(child);

    if (childToParent.has(child)) {
      // Diamond / multi-parent: subsequent parent edge silently discarded
      continue;
    }
    childToParent.set(child, parent);

    if (!childrenOf.has(parent)) childrenOf.set(parent, []);
    childrenOf.get(parent).push(child);
  }

  // ---- Group nodes into connected components (undirected over accepted structural edges)
  const adj = new Map();
  const addUndirected = (a, b) => {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a).add(b);
    adj.get(b).add(a);
  };
  for (const node of allNodes) if (!adj.has(node)) adj.set(node, new Set());
  for (const [child, parent] of childToParent.entries()) addUndirected(parent, child);

  const visited = new Set();
  const components = [];
  for (const node of allNodes) {
    if (visited.has(node)) continue;
    const comp = [];
    const stack = [node];
    visited.add(node);
    while (stack.length) {
      const cur = stack.pop();
      comp.push(cur);
      for (const nb of adj.get(cur)) {
        if (!visited.has(nb)) {
          visited.add(nb);
          stack.push(nb);
        }
      }
    }
    components.push(comp);
  }

  // ---- Process each component into a hierarchy object
  const hierarchies = [];
  let total_trees = 0;
  let total_cycles = 0;

  for (const comp of components) {
    const compSet = new Set(comp);

    // Root = node in component that never appears as a child (within accepted structure)
    const roots = comp.filter((n) => !childToParent.has(n));

    let isCycle = false;
    let root;

    if (roots.length === 0) {
      // Pure cycle — all nodes are children. Lexicographically smallest as root.
      isCycle = true;
      root = comp.slice().sort()[0];
    } else {
      // Smallest root label among candidate roots (stable, deterministic)
      root = roots.slice().sort()[0];
      // Detect a cycle reachable inside this component's directed structure
      isCycle = hasCycle(root, childrenOf, compSet);
    }

    if (isCycle) {
      total_cycles += 1;
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      const tree = buildTree(root, childrenOf);
      const depth = computeDepth(root, childrenOf);
      total_trees += 1;
      hierarchies.push({ root, tree, depth });
    }
  }

  // ---- largest_tree_root: greatest depth, tie -> lexicographically smaller root
  let largest_tree_root = "";
  let bestDepth = -1;
  for (const h of hierarchies) {
    if (h.has_cycle) continue;
    if (
      h.depth > bestDepth ||
      (h.depth === bestDepth && h.root < largest_tree_root)
    ) {
      bestDepth = h.depth;
      largest_tree_root = h.root;
    }
  }

  return {
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root,
    },
  };
}

/** DFS cycle detection over the directed accepted structure within a component. */
function hasCycle(root, childrenOf, compSet) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  for (const n of compSet) color.set(n, WHITE);

  // Iterative DFS with state to detect back-edges
  const stack = [{ node: root, idx: 0 }];
  color.set(root, GRAY);
  while (stack.length) {
    const frame = stack[stack.length - 1];
    const kids = childrenOf.get(frame.node) || [];
    if (frame.idx < kids.length) {
      const next = kids[frame.idx++];
      const c = color.get(next);
      if (c === GRAY) return true;      // back edge -> cycle
      if (c === WHITE) {
        color.set(next, GRAY);
        stack.push({ node: next, idx: 0 });
      }
    } else {
      color.set(frame.node, BLACK);
      stack.pop();
    }
  }
  return false;
}

/** Build nested tree object: { root: { childA: {...}, childB: {...} } }. */
function buildTree(root, childrenOf) {
  const build = (node, seen) => {
    const obj = {};
    const kids = childrenOf.get(node) || [];
    for (const k of kids) {
      if (seen.has(k)) continue; // safety against pathological structure
      obj[k] = build(k, new Set(seen).add(k));
    }
    return obj;
  };
  return { [root]: build(root, new Set([root])) };
}

/** Depth = node count on longest root-to-leaf path. */
function computeDepth(root, childrenOf) {
  const dfs = (node, seen) => {
    const kids = childrenOf.get(node) || [];
    let max = 0;
    for (const k of kids) {
      if (seen.has(k)) continue;
      max = Math.max(max, dfs(k, new Set(seen).add(k)));
    }
    return 1 + max;
  };
  return dfs(root, new Set([root]));
}

module.exports = { processData };

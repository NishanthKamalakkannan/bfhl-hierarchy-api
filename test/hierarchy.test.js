const test = require("node:test");
const assert = require("node:assert/strict");
const { processHierarchyPayload } = require("../src/hierarchy");

test("classifies invalid and duplicate entries", () => {
  const result = processHierarchyPayload(["A->B", "A->B", "hello", "A->A", "1->2", "A->"]);

  assert.deepEqual(result.invalidEntries, ["hello", "A->A", "1->2", "A->"]);
  assert.deepEqual(result.duplicateEdges, ["A->B"]);
});

test("keeps first parent in multi-parent scenario", () => {
  const result = processHierarchyPayload(["A->D", "B->D", "D->E"]);
  assert.equal(result.hierarchies.length, 1);
  assert.deepEqual(result.hierarchies[0].tree, { A: { D: { E: {} } } });
});

test("detects cycle and omits depth for cyclic groups", () => {
  const result = processHierarchyPayload(["X->Y", "Y->Z", "Z->X"]);
  assert.equal(result.hierarchies[0].root, "X");
  assert.equal(result.hierarchies[0].has_cycle, true);
  assert.equal("depth" in result.hierarchies[0], false);
});

test("matches sample summary behavior", () => {
  const result = processHierarchyPayload([
    "A->B",
    "A->C",
    "B->D",
    "C->E",
    "E->F",
    "X->Y",
    "Y->Z",
    "Z->X",
    "P->Q",
    "Q->R",
    "G->H",
    "G->H",
    "G->I",
    "hello",
    "1->2",
    "A->",
  ]);

  assert.deepEqual(result.summary, {
    total_trees: 3,
    total_cycles: 1,
    largest_tree_root: "A",
  });
  assert.deepEqual(result.duplicateEdges, ["G->H"]);
  assert.deepEqual(result.invalidEntries, ["hello", "1->2", "A->"]);
});

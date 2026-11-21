// Pure DC Linear Nodal Analysis Solver (Kirchhoff Current Law: G * V = I)
// Used by CircuitSolver (real node voltages, voltage drops, branch currents)
// and MultimeterEngine (exact V_DC, Thevenin equivalent OHM/CONTINUITY, and shunt A_DC).

const G_MIN = 1e-9; // Tiny leakage conductance (1 GOhm) to stabilize open-circuit positive nodes

/**
 * Solve an n x n dense linear system A * x = b using Gaussian elimination with partial pivoting.
 * Matrix `mat` is a flat Float64Array of size n * (n + 1) representing augmented [A | b].
 */
function solveDenseLinearSystem(mat, n) {
  const cols = n + 1;
  for (let col = 0; col < n; col++) {
    // Partial pivoting: find row with largest absolute value in current column
    let pivotRow = col;
    let maxAbs = Math.abs(mat[col * cols + col]);
    for (let r = col + 1; r < n; r++) {
      const val = Math.abs(mat[r * cols + col]);
      if (val > maxAbs) {
        maxAbs = val;
        pivotRow = r;
      }
    }

    if (maxAbs < 1e-15) {
      continue;
    }

    if (pivotRow !== col) {
      for (let c = col; c < cols; c++) {
        const tmp = mat[col * cols + c];
        mat[col * cols + c] = mat[pivotRow * cols + c];
        mat[pivotRow * cols + c] = tmp;
      }
    }

    const pivotVal = mat[col * cols + col];
    for (let r = col + 1; r < n; r++) {
      const factor = mat[r * cols + col] / pivotVal;
      if (Math.abs(factor) < 1e-18) continue;
      mat[r * cols + col] = 0;
      for (let c = col + 1; c < cols; c++) {
        mat[r * cols + c] -= factor * mat[col * cols + c];
      }
    }
  }

  const x = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) {
    const diag = mat[r * cols + r];
    if (Math.abs(diag) < 1e-15) {
      x[r] = 0;
      continue;
    }
    let sum = mat[r * cols + n];
    for (let c = r + 1; c < n; c++) {
      sum -= mat[r * cols + c] * x[c];
    }
    x[r] = sum / diag;
  }
  return x;
}

function buildBranchAdjacency(branches) {
  const adj = new Map();
  const add = (a, b) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push(b);
  };
  for (const br of branches) {
    if (!br || !br.a || !br.b || !(br.r > 0) || !Number.isFinite(br.r)) continue;
    add(br.a, br.b);
    add(br.b, br.a);
  }
  return adj;
}

function findConnectedSet(adj, seeds) {
  const visited = new Set();
  const queue = [];
  for (const s of seeds) {
    if (s && !visited.has(s)) {
      visited.add(s);
      queue.push(s);
    }
  }
  while (queue.length > 0) {
    const curr = queue.shift();
    const neighbors = adj.get(curr);
    if (!neighbors) continue;
    for (const nxt of neighbors) {
      if (!visited.has(nxt)) {
        visited.add(nxt);
        queue.push(nxt);
      }
    }
  }
  return visited;
}

/**
 * Solve DC node voltages for a resistive network powered by a Thevenin battery source
 * between `batPos` (+V_oc through internal resistance rBat) and `batNeg` (0V reference).
 *
 * Returns:
 * - nodeVoltages: Object mapping pinId -> number (Volts) or null (floating)
 * - batteryCurrent: Total current leaving BAT_POS (Amperes)
 */
export function solveLinearDC({
  pinIds = [],
  branches = [],
  batPos = 'BAT_POS',
  batNeg = 'BAT_NEG',
  vOc = 12.6,
  rBat = 0.02,
}) {
  const nodeVoltages = {};
  for (const id of pinIds) {
    nodeVoltages[id] = null;
  }

  const adj = buildBranchAdjacency(branches);
  const reachedFromPos = findConnectedSet(adj, [batPos]);
  const reachedFromNeg = findConnectedSet(adj, [batNeg]);

  // All nodes connected to either battery terminal participate in the nodal solve
  const activeNodes = [];
  const nodeIndex = new Map();

  for (const id of pinIds) {
    if (id === batNeg) {
      nodeVoltages[id] = 0.0;
      continue;
    }
    if (reachedFromPos.has(id) || reachedFromNeg.has(id)) {
      nodeIndex.set(id, activeNodes.length);
      activeNodes.push(id);
    }
  }

  // Ensure batPos is always included even if disconnected from other pins
  if (!nodeIndex.has(batPos) && batPos !== batNeg) {
    nodeIndex.set(batPos, activeNodes.length);
    activeNodes.push(batPos);
  }

  const n = activeNodes.length;
  if (n === 0) {
    return { nodeVoltages, batteryCurrent: 0 };
  }

  const cols = n + 1;
  const mat = new Float64Array(n * cols);

  // Stamp Norton equivalent of Thevenin battery (vOc in series with rBat) at batPos -> batNeg (ground)
  const posIdx = nodeIndex.get(batPos);
  if (posIdx !== undefined) {
    const gBat = 1.0 / rBat;
    mat[posIdx * cols + posIdx] += gBat;
    mat[posIdx * cols + n] += vOc * gBat;
  }

  // Stamp every resistive branch
  for (const br of branches) {
    if (!br || !br.a || !br.b || !(br.r > 0) || !Number.isFinite(br.r)) continue;
    const ia = br.a === batNeg ? -1 : nodeIndex.get(br.a);
    const ib = br.b === batNeg ? -1 : nodeIndex.get(br.b);
    if (ia === undefined || ib === undefined) continue;
    if (ia === ib) continue;

    const g = 1.0 / br.r;
    if (ia >= 0) {
      mat[ia * cols + ia] += g;
    }
    if (ib >= 0) {
      mat[ib * cols + ib] += g;
    }
    if (ia >= 0 && ib >= 0) {
      mat[ia * cols + ib] -= g;
      mat[ib * cols + ia] -= g;
    }
  }

  // Tiny stabilizing conductance to ground for floating positive-only islands
  for (let i = 0; i < n; i++) {
    mat[i * cols + i] += G_MIN;
  }

  const sol = solveDenseLinearSystem(mat, n);

  for (let i = 0; i < n; i++) {
    const id = activeNodes[i];
    // Clean near-zero floating point noise
    const v = Math.abs(sol[i]) < 1e-7 ? 0.0 : sol[i];
    nodeVoltages[id] = v;
  }
  nodeVoltages[batNeg] = 0.0;

  const vBatPos = nodeVoltages[batPos] ?? vOc;
  const batteryCurrent = Math.max(0, (vOc - vBatPos) / rBat);

  return { nodeVoltages, batteryCurrent };
}

/**
 * Measure exact Thevenin equivalent resistance (in Ohms) between `pinA` and `pinB`
 * on a de-energized passive resistive network by injecting a 1A test current at pinA
 * with pinB referenced to 0V. Returns null if open-circuit (no conducting path).
 */
export function measureEquivalentResistance(branches, pinA, pinB) {
  if (!pinA || !pinB) return null;
  if (pinA === pinB) return 0.05;

  const adj = buildBranchAdjacency(branches);
  const compSet = findConnectedSet(adj, [pinA]);
  if (!compSet.has(pinB)) {
    return null; // Open circuit (O.L)
  }

  const activeNodes = [];
  const nodeIndex = new Map();
  for (const id of compSet) {
    if (id === pinB) continue; // Reference node = 0V
    nodeIndex.set(id, activeNodes.length);
    activeNodes.push(id);
  }

  const n = activeNodes.length;
  if (n === 0) return 0.05;

  const cols = n + 1;
  const mat = new Float64Array(n * cols);

  for (const br of branches) {
    if (!br || !br.a || !br.b || !(br.r > 0) || !Number.isFinite(br.r)) continue;
    if (!compSet.has(br.a) || !compSet.has(br.b)) continue;
    const ia = br.a === pinB ? -1 : nodeIndex.get(br.a);
    const ib = br.b === pinB ? -1 : nodeIndex.get(br.b);
    if (ia === undefined || ib === undefined || ia === ib) continue;

    const g = 1.0 / br.r;
    if (ia >= 0) mat[ia * cols + ia] += g;
    if (ib >= 0) mat[ib * cols + ib] += g;
    if (ia >= 0 && ib >= 0) {
      mat[ia * cols + ib] -= g;
      mat[ib * cols + ia] -= g;
    }
  }

  for (let i = 0; i < n; i++) {
    mat[i * cols + i] += G_MIN;
  }

  const idxA = nodeIndex.get(pinA);
  if (idxA === undefined) return null;
  mat[idxA * cols + n] = 1.0; // Inject 1.0 A into pinA

  const sol = solveDenseLinearSystem(mat, n);
  const rEq = sol[idxA];
  if (!Number.isFinite(rEq) || rEq < 0) return null;
  return rEq;
}

/**
 * Measure DC series current (Amperes) when multimeter probes bridge `pinA` (red) and `pinB` (black)
 * through a low-resistance internal shunt (0.02 Ohm).
 */
export function measureSeriesAmmeter({
  pinIds = [],
  branches = [],
  pinA,
  pinB,
  batPos = 'BAT_POS',
  batNeg = 'BAT_NEG',
  vOc = 12.6,
  rBat = 0.02,
  rShunt = 0.02,
}) {
  if (!pinA || !pinB || pinA === pinB) {
    return { current: 0, overload: false };
  }

  const withShunt = [...branches, { a: pinA, b: pinB, r: rShunt, kind: 'ammeter_shunt' }];
  const { nodeVoltages } = solveLinearDC({
    pinIds,
    branches: withShunt,
    batPos,
    batNeg,
    vOc,
    rBat,
  });

  const vA = nodeVoltages[pinA];
  const vB = nodeVoltages[pinB];
  if (vA === null || vB === null || vA === undefined || vB === undefined) {
    return { current: 0, overload: false };
  }

  const current = (vA - vB) / rShunt;
  const overload = Math.abs(current) > 25.0; // 20A DMM fuse limit
  return { current, overload };
}

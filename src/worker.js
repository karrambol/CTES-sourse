import odex from './odex';
import { convectionObj } from './hConv';
import createCircuit from './createCircuit';
import initClampDE from './createDE';

function createI (load) {
  let arr = load.values
    .filter(el => el.t || el.i)
    .map(el => {
      return { t: parseFloat(el.t), i: parseFloat(el.i) };
    });
  if (load.option === 'const')
    return function iConst () {
      return arr[0].i;
    };
  arr = arr.reverse();
  if (load.option === 'step')
    return function iStep (t) {
      if (t >= arr[0].t) return arr[0].i;
      return arr.find(el => el.t <= t).i;
    };

  if (load.option === 'linear')
    return function iLinear (t) {
      if (t >= arr[0].t) return arr[0].i;
      const ind = arr.findIndex(el => el.t <= t);
      const i0 = arr[ind].i;
      const i1 = arr[ind - 1].i;
      const t0 = arr[ind].t;
      const t1 = arr[ind - 1].t;
      const i = i0 + ((t - t0) * (i1 - i0)) / (t1 - t0);
      return i;
    };
  return null;
}
function parseValues (obj) {
  return Object.entries(obj).reduce((acc, el) => {
    acc[el[0]] = { ...el[1], value: parseFloat(el[1].value) };
    return acc;
  }, {});
}
let x0 = 0;
let y0 = 0;
function runSolver (fn, solver, solTask, callback) {
  const a = solver.solve(
    fn,
    x0,
    y0,
    solTask.t,
    solver.grid(solTask.step, function collectResult (x1, y) {
      callback(null, null, x1, y);
    })
  );
  x0 = a.xEnd;
  y0 = a.y;
}
function solveDE ({ thermal, resistance, task, loads, solver }) {
  thermal = parseValues(thermal);
  solver.values = solver.values
    .map(el => {
      return { t: parseFloat(el.t), step: parseFloat(el.step) };
    })
    .filter(el => el.t && el.step);
  const alpha = thermal.alpha.value;
  const Tair =
    thermal.Tair.unit === 'К'
      ? thermal.Tair.value
      : thermal.Tair.value + 273.15;
  const Tref = thermal.Tref.value;
  const results = [];
  const iL = createI(loads[0]);
  const iC = createI(loads[1]);
  const hConv = convectionObj(thermal);
  const c = createCircuit(resistance);
  const f = initClampDE(Tair, iC, iL, hConv, c, thermal);
  results[0] = { task, result: [] };
  function collectValues (n, x0, x1, y) {
    const collect = [
      x1,
      y[0],
      c.Es([iC(x1), iL(x1)]) * (1 + alpha * (Tair + y[0] - Tref)),
      iC(x1),
      iL(x1),
    ];
    postMessage({ task, result: collect });

    if (results[0].result.length === 0) {
      results[0].result[0] = collect;
    } else if (
      results[0].result[results[0].result.length - 1][0] !== collect[0]
    ) {
      results[0].result = [...results[0].result, collect];
    }
  }
  const start = new Date();
  const s = new odex.Solver(1);
  s.absoluteTolerance = 1e-12;
  s.relativeTolerance = 1e-12;
  s.denseOutput = true;
  solver.values.forEach(el => {
    runSolver(f, s, el, collectValues);
  });
  const end = new Date();
  console.log('Время расчета:', end - start);
  postMessage({ results: results[0], isDone: true });
}
onmessage = function onMessage (e) {
  solveDE(e.data);
};

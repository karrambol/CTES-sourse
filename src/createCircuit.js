import Circuit from './circuit'
import Simplex from './NMSimplex'

const ref = [
  {
    cont: 16,
    value: [
      [0, 1000, 11.42079057],
      [1000, 0, 25.40112634],
      // [1000, 1000, 48.30202308]
    ],
  },
  // {
  //     cont: 116,
  //     value: [
  //         [0, 1000, 12.48609821],
  //         [1000, 0, 125.9612051]
  //         // [1000, 1000, 150.9349398]
  //     ]

  // },
  // {
  //     cont: 316,
  //     value: [
  //         [0, 1000, 12.6247969],
  //         [1000, 0, 325.9571596]
  //         // [1000, 1000, 351.206916]
  //     ]

  // }
]

function createGraph(n) {
  const nodes = n * 3
  const branches = 5 * n - 3
  const string = new Array(branches)
  string.fill(0)
  let graph = new Array(nodes - 1)
  graph.fill(string)
  graph = graph.map((el, m) => {
    return el.map((el2, i) => {
      // Ток вытекает в узел справа
      if (m <= n - 2 && i === m) return -1
      if (m >= n && m <= 2 * n - 2 && i === m + n - 1) return -1
      if (m >= 2 * n && m <= 3 * n - 2 && i === m + 2 * n - 2) return -1
      // Ток втекает из узла слева
      if (m >= 1 && m <= n - 1 && i === m - 1) return 1
      if (m >= n + 1 && m <= 2 * n - 1 && i === m + n - 2) return 1
      if (m >= 2 * n + 1 && m <= 3 * n - 1 && i === m + 2 * n - 3) return 1
      // Ток вытекает в узел снизу
      if (m >= 0 && m <= n - 1 && i === m + n - 1) return -1
      if (m >= n && m <= 2 * n - 1 && i === m + 2 * n - 2) return -1
      // Ток втекает из узла сверху
      if (m >= n && m <= 2 * n - 1 && i === m - 1) return 1
      if (m >= 2 * n && m <= 3 * n - 1 && i === m + n - 2) return 1
      return 0
    })
  })
  return graph
}

function createR(wb, wt, clampV, clampH, cont, n) {
  const cb = cont / 2
  const ct = cont / 2
  const branches = 5 * n - 3
  let R = new Array(branches)
  R.fill(0)
  R = R.map((el, i) => {
    if (i <= n - 2) return wt / (n - 1)
    if (i <= 2 * n - 1) return ct * n + (clampV * n) / 2
    if (i <= 3 * n - 3) return clampH / (n - 1)
    if (i <= 4 * n - 3) return cb * n + (clampV * n) / 2
    if (i <= 5 * n - 4) return wb / (n - 1)
    return 0
  })
  return R
}

function createICJ(n) {
  const branches = 5 * n - 3
  let string = new Array(branches)
  string.fill(0)
  string = string.map((el, i) => {
    if (i === n - 1) return 1
    if (i === 3 * n - 2) return 1
    if (i >= 4 * n - 2) return 1
    return 0
  })
  return string
}
function createILJ(n) {
  const branches = 5 * n - 3
  let string = new Array(branches)
  string.fill(0)
  string = string.map((el, i) => {
    if (i >= 4 * n - 2) return 1
    return 0
  })
  return string
}

export default function createCircuit(obj) {
  const n = parseInt(obj.n.value, 10)
  const a = createGraph(n)
  const iCJ = createICJ(n)
  const iLJ = createILJ(n)
  const argArr = [obj.Rwb, obj.Rwt, obj.Rv, obj.Rh, obj.Rc, obj.n].map(el =>
    el.units === 'мкОм' ? el.value * 1e-6 : el.value * 1
  )
  const R = createR(...argArr)
  return new Circuit(R, a, [iCJ, iLJ])
}

function createCircuitVH(obj, v, h, cont) {
  const a = createGraph(obj.n.value)
  const iCJ = createICJ(obj.n.value)
  const iLJ = createILJ(obj.n.value)
  const argArr = [
    obj.Rwb,
    obj.Rwt,
    { name: 'Rv', value: v, units: 'мкОм' },
    { name: 'Rh', value: h, units: 'мкОм' },
    { name: 'Rc', value: cont, units: 'мкОм' },
    obj.n,
  ].map(el => (el.units === 'мкОм' ? el.value * 1e-6 : el.value))
  const R = createR(...argArr)
  return new Circuit(R, a, [iCJ, iLJ])
}

export function NMSearchVH(obj, callback) {
  function objFunc([v, h]) {
    const rez = ref.reduce((acc, el, i, arr) => {
      const c = createCircuitVH(obj, v, h, el.cont)
      const strErr = el.value.reduce((acc2, el2, i2, arr2) => {
        return (
          acc2 +
          Math.abs(c.Es([el2[0], el2[1]]) - el2[2]) / el2[2] / arr2.length
        )
      }, 0)
      return acc + Math.abs(strErr) / arr.length
    }, 0)
    return rez
  }
  const s = new Simplex()
  return s.solve(objFunc, [obj.Rv.value, obj.Rh.value], 150, callback)
}

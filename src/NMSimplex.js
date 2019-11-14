/* eslint-disable no-console */
// Implementation of Nelder-Mead Simplex Linear Optimizer
//	TODO: Robust Unit Test of 2D Function Optimizations
//	TODO: Extend to support functions beyond the 2D Space

class Simplex {
  constructor() {
    this.vertices = []
    this.centroid = null
    this.reflect_point = null // Reflection point, updated on each iteration
    this.reflect_cost = null
    this.expand_point = null
    this.expand_cost = null
    this.contract_point = null
    this.contract_cost = null
  }

  solve(objFuncIn, x0, numIters, callback, isMem = true) {
    const S = this
    if (!Array.isArray(x0)) {
      S.vertices = [x0, x0 + 1, x0 + 2]
    } else {
      S.vertices = [x0, [x0[0], x0[1] + 10], [x0[0] + 10, x0[1]]]
    }
    const cash = {}
    let count = 0
    function objFunc(arg) {
      if (isMem) {
        if (arg in cash) return cash[arg]
        count += 1
        cash[arg] = objFuncIn(arg)
        return cash[arg]
      }
      count += 1
      return objFuncIn(arg)
    }
    let action = ''
    let x
    for (let itr = 0; itr < numIters; itr += 1) {
      S.updateCentroid(objFunc) // needs to know which objFunc to hand to sortByCost
      S.updateReflectPoint(objFunc)
      ;[x] = S.vertices
      if (
        S.reflect_cost < S.getVertexCost(objFunc, 'secondWorst') &&
        S.reflect_cost > S.getVertexCost(objFunc, 'best')
      ) {
        action = 'reflect'
        S.reflect()
      } else if (S.reflect_cost < S.getVertexCost(objFunc, 'best')) {
        // new point is better than previous best: expand
        S.updateExpandPoint(objFunc)
        if (S.expand_cost < S.reflect_cost) {
          action = 'expand'
          S.expand()
        } else {
          action = 'reflect'
          S.reflect()
        }
      } else {
        // new point was worse than all current points: contract
        S.updateContractPoint(objFunc)
        if (S.contract_cost < S.getVertexCost(objFunc, 'worst')) {
          action = 'contract'
          S.contract()
        } else {
          action = 'reduce'
          S.reduce()
        }
      }
      callback(itr, x, objFunc(x), S.centroid, action, count)
      if (
        Math.abs(x[0] - S.centroid[0]) + Math.abs(x[1] - S.centroid[1]) <
        1e-20
      ) {
        itr = numIters
        action = 'tolerance reached'
      }
    }
    return [x, objFunc(x), S.centroid, action]
  }

  // sort the vertices of Simplex by their objective value as defined by objFunc
  sortByCost(objFunc) {
    this.vertices.sort((a, b) => objFunc(a) - objFunc(b))
  }

  // find the centroid of the simplex (ignoring the vertex with the worst objective value)
  updateCentroid(objFunc) {
    let vert
    let isMaped = false
    this.sortByCost(objFunc)
    if (!Array.isArray(this.vertices[0])) {
      isMaped = true
      vert = this.vertices.map(el => [el])
    } else {
      isMaped = false
      ;[...vert] = this.vertices
    }
    vert.pop()
    const rez = vert[0].map((el, i) => {
      return (
        vert.reduce((acc, el2) => {
          return acc + el2[i]
        }, 0) / vert.length
      )
    })
    if (isMaped) {
      ;[this.centroid] = rez
    } else {
      this.centroid = rez
    }
  }

  updateReflectPoint(objFunc) {
    const worstPoint = this.vertices[this.vertices.length - 1]
    if (!Array.isArray(this.vertices[0])) {
      this.reflect_point = this.centroid + (this.centroid - worstPoint)
    } else {
      this.reflect_point = this.centroid.map((el, i) => {
        return this.centroid[i] + (this.centroid[i] - worstPoint[i])
      })
    }
    this.reflect_cost = objFunc(this.reflect_point)
  }

  updateExpandPoint(objFunc) {
    const worstPoint = this.vertices[this.vertices.length - 1]
    if (!Array.isArray(this.vertices[0])) {
      this.expand_point = this.centroid + 2 * (this.centroid - worstPoint)
    } else {
      this.expand_point = this.centroid.map((el, i) => {
        return this.centroid[i] + 2 * (this.centroid[i] - worstPoint[i])
      })
    }
    this.expand_cost = objFunc(this.expand_point)
  }

  updateContractPoint(objFunc) {
    const worstPoint = this.vertices[this.vertices.length - 1]
    if (!Array.isArray(this.vertices[0])) {
      this.contract_point = this.centroid + 0.5 * (this.centroid - worstPoint)
    } else {
      this.contract_point = this.centroid.map((el, i) => {
        return this.centroid[i] + 0.5 * (this.centroid[i] - worstPoint[i])
      })
    }
    this.contract_cost = objFunc(this.contract_point)
  }

  // assumes sortByCost has been called prior!
  getVertexCost(objFunc, option) {
    let rez
    if (option === 'worst') {
      rez = objFunc(this.vertices[this.vertices.length - 1])
    } else if (option === 'secondWorst') {
      rez = objFunc(this.vertices[this.vertices.length - 2])
    } else if (option === 'best') {
      rez = objFunc(this.vertices[0])
    }
    return rez
  }

  reflect() {
    this.vertices[this.vertices.length - 1] = this.reflect_point // replace the worst vertex with the reflect vertex
  }

  expand() {
    this.vertices[this.vertices.length - 1] = this.expand_point // replace the worst vertex with the expand vertex
  }

  contract() {
    this.vertices[this.vertices.length - 1] = this.contract_point // replace the worst vertex with the contract vertex
  }

  reduce() {
    let bestX
    let a
    if (!Array.isArray(this.vertices[0])) {
      ;[bestX] = this.vertices
      for (a = 1; a < this.vertices.length; a += 1) {
        this.vertices[a] = bestX + 0.5 * (this.vertices[a] - bestX) // 0.1 + 0.5(0.1-0.1)
      }
    } else {
      ;[bestX] = this.vertices
      this.vertices = this.vertices.map(el => {
        return el.map((el2, i2) => {
          return bestX[i2] + 0.5 * (el2 - bestX[i2])
        })
      })
    }
  }
}

export default Simplex

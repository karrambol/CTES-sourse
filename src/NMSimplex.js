// Implementation of Nelder-Mead Simplex Linear Optimizer

class Simplex {
  constructor () {
    this.vertices = []
    this.centroid = null
    this.reflectPoint = null // Reflection point, updated on each iteration
    this.reflectCost = null
    this.expandPoint = null
    this.expandCost = null
    this.contractPoint = null
    this.contractCost = null
  }

  solve (objFuncIn, x0, numIters, callback, isMem = true) {
    const S = this
    let objFuncEvaluationCount = 0
    let objFunc
    if (!Array.isArray(x0)) {
      S.vertices = [x0, x0 + 1, x0 + 2]
    } else {
      S.vertices = [x0, [x0[0], x0[1] + 10], [x0[0] + 10, x0[1]]]
    }
    if (isMem) {
      const cache = {}
      objFunc = function memoizedObj (arg) {
        if (arg in cache) return cache[arg]
        objFuncEvaluationCount += 1
        cache[arg] = objFuncIn(arg)
        return cache[arg]
      }
    } else {
      objFunc = function unmemoizedObj (arg) {
        objFuncEvaluationCount += 1
        return objFuncIn(arg)
      }
    }
    let action = ''
    let x
    for (let itr = 0; itr < numIters; itr += 1) {
      S.updateCentroid(objFunc) // needs to know which objFunc to hand to sortByCost
      S.updateReflectPoint(objFunc)
      ;[x] = S.vertices
      if (
        S.reflectCost < S.getVertexCost(objFunc, 'secondWorst') &&
        S.reflectCost > S.getVertexCost(objFunc, 'best')
      ) {
        action = 'reflect'
        S.reflect()
      } else if (S.reflectCost < S.getVertexCost(objFunc, 'best')) {
        // new point is better than previous best: expand
        S.updateExpandPoint(objFunc)
        if (S.expandCost < S.reflectCost) {
          action = 'expand'
          S.expand()
        } else {
          action = 'reflect'
          S.reflect()
        }
      } else {
        // new point was worse than all current points: contract
        S.updateContractPoint(objFunc)
        if (S.contractCost < S.getVertexCost(objFunc, 'worst')) {
          action = 'contract'
          S.contract()
        } else {
          action = 'reduce'
          S.reduce()
        }
      }
      if (callback) {
        callback(itr, x, objFunc(x), S.centroid, action, objFuncEvaluationCount)
      }
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
  sortByCost (objFunc) {
    this.vertices.sort((a, b) => objFunc(a) - objFunc(b))
  }

  // find the centroid of the simplex (ignoring the vertex with the worst objective value)
  updateCentroid (objFunc) {
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

  updateReflectPoint (objFunc) {
    const worstPoint = this.vertices[this.vertices.length - 1]
    if (!Array.isArray(this.vertices[0])) {
      this.reflectPoint = this.centroid + (this.centroid - worstPoint)
    } else {
      this.reflectPoint = this.centroid.map((el, i) => {
        return this.centroid[i] + (this.centroid[i] - worstPoint[i])
      })
    }
    this.reflectCost = objFunc(this.reflectPoint)
  }

  updateExpandPoint (objFunc) {
    const worstPoint = this.vertices[this.vertices.length - 1]
    if (!Array.isArray(this.vertices[0])) {
      this.expandPoint = this.centroid + 2 * (this.centroid - worstPoint)
    } else {
      this.expandPoint = this.centroid.map((el, i) => {
        return this.centroid[i] + 2 * (this.centroid[i] - worstPoint[i])
      })
    }
    this.expandCost = objFunc(this.expandPoint)
  }

  updateContractPoint (objFunc) {
    const worstPoint = this.vertices[this.vertices.length - 1]
    if (!Array.isArray(this.vertices[0])) {
      this.contractPoint = this.centroid + 0.5 * (this.centroid - worstPoint)
    } else {
      this.contractPoint = this.centroid.map((el, i) => {
        return this.centroid[i] + 0.5 * (this.centroid[i] - worstPoint[i])
      })
    }
    this.contractCost = objFunc(this.contractPoint)
  }

  // assumes sortByCost has been called prior!
  getVertexCost (objFunc, option) {
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

  reflect () {
    this.vertices[this.vertices.length - 1] = this.reflectPoint // replace the worst vertex with the reflect vertex
  }

  expand () {
    this.vertices[this.vertices.length - 1] = this.expandPoint // replace the worst vertex with the expand vertex
  }

  contract () {
    this.vertices[this.vertices.length - 1] = this.contractPoint // replace the worst vertex with the contract vertex
  }

  reduce () {
    let bestX
    let a
    if (!Array.isArray(this.vertices[0])) {
      ;[bestX] = this.vertices
      for (a = 1; a < this.vertices.length; a += 1) {
        this.vertices[a] = bestX + 0.5 * (this.vertices[a] - bestX)
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

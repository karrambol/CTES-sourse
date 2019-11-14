// const matrix = require ('matrix-js');
import matrix from 'matrix-js'

function matInterchange(inMat, ind1, ind2) {
  const rez = new Array(inMat)
  const temp = rez[ind1]
  rez[ind1] = rez[ind2]
  rez[ind2] = temp
  return inMat
}
function matSize(m) {
  const s = []
  let mat = m
  while (Array.isArray(mat)) {
    s.push(mat.length)
    // eslint-disable-next-line no-param-reassign
    ;[mat] = mat
  }
  return s
}
function matIdentity(size) {
  const str = new Array(size)
  str.fill(0)
  const rez = new Array(size)
  rez.fill(str)
  return rez.map((el1, i1) => {
    return el1.map((el2, i2) => {
      if (i1 === i2) return 1
      return el2
    })
  })
}

function matInv(inp) {
  const mat = inp()
  const siz = matSize(mat)
  const result = matIdentity(siz[0])
  // Row Reduction
  for (let i = 0; i < siz[0] - 1; i += 1) {
    if (mat[i][i].num === 0) {
      matInterchange(mat, i, i + 1)
      matInterchange(result, i, i + 1)
    }
    if (mat[i][i] !== 1) {
      const factor = mat[i][i]
      for (let col = 0; col < siz[1]; col += 1) {
        mat[i][col] /= factor
        result[i][col] /= factor
      }
    }
    for (let j = i + 1; j < siz[0]; j += 1) {
      if (!(mat[j][i].num === 0)) {
        const temp = -mat[j][i]
        for (let k = 0; k < siz[1]; k += 1) {
          mat[j][k] = temp * mat[i][k] + mat[j][k]
          result[j][k] = temp * result[i][k] + result[j][k]
        }
      }
    }
  }
  // Further reduction to convert mat to identity
  const last = siz[0] - 1
  if (mat[last][last] !== 1) {
    const factor = mat[last][last]
    for (let col = 0; col < siz[1]; col += 1) {
      mat[last][col] /= factor
      result[last][col] /= factor
    }
  }
  for (let i = siz[0] - 1; i > 0; i -= 1) {
    for (let j = i - 1; j >= 0; j -= 1) {
      const temp = -mat[j][i]
      for (let k = 0; k < siz[1]; k += 1) {
        mat[j][k] = temp * mat[i][k] + mat[j][k]
        result[j][k] = temp * result[i][k] + result[j][k]
      }
    }
  }
  return matrix(result)
}

class Circuit {
  constructor(rIni, aIni, arrJ) {
    this.A = matrix(aIni)
    this.Y = matrix(
      rIni.map((el, i, arr) => arr.map((el2, i2) => (i2 === i ? 1 / el : 0)))
    )
    this.Ay = matrix(this.A.prod(this.Y))
    this.Ayat = matrix(this.Ay.prod(matrix(this.A.trans())))
    this.invAyat = matInv(this.Ayat)
    this.arrJ = arrJ
  }

  U0(arri) {
    this.J = this.arrJ.map((el, i) => el.map(e => e * arri[i]))
    this.J = this.J.reduce((acc, el) => acc.map((e, i2) => e + el[i2]))
    this.J = this.J.map(el => [el])
    this.J = matrix(this.J)
    this.minAj = matrix(matrix(this.A.map(el => -1 * el)).prod(this.J))
    return matrix(this.invAyat.prod(this.minAj))
  }

  U(arri) {
    const rez = matrix(matrix(this.A.trans()).prod(this.U0(arri)))
    return rez
  }

  E(arri) {
    let rez = this.U(arri)()
    rez = rez.reduce((acc, el, i) => {
      return acc + el[0] ** 2 * this.Y(i, i)
    }, 0)
    return rez
  }

  Es(arri) {
    const u0 = this.U0(arri)()
    const n = (u0.length + 1) / 3
    return u0[0][0] * arri[0] + u0[2 * n][0] * arri[1]
  }

  I(arri) {
    let rez = this.U(arri)()
    rez = matrix(rez.map((el, i) => el[0] * this.Y(i, i)))
    return rez
  }
}

export default Circuit

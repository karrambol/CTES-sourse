
function createGraph (n) {
    const nodes = n * 3;
    const branches = 5 * n - 3;
    const string =  new Array(branches)
    string.fill(0)
    let graph = new Array(nodes - 1)
    graph.fill(string)
    graph = graph.map((el,m) => {
        return el.map((el2,i) => {
            // Ток вытекает в узел справа
            if (                   m <= n - 2       && i === m )                return -1
            if ( m >= n         && m <= 2 * n - 2   && i === m + n - 1 )        return -1
            if ( m >= 2 * n     && m <= 3 * n - 2   && i === m + 2 * n - 2 )    return -1
            // Ток втекает из узла слева
            if ( m >= 1         && m <= n - 1       && i === m - 1 )            return 1
            if ( m >= n + 1     && m <= 2 * n - 1   && i === m + n - 2 )        return 1
            if ( m >= 2 * n + 1 && m <= 3 * n - 1   && i === m + 2 * n - 3 )    return 1
            // Ток вытекает в узел снизу
            if ( m >= 0         && m <= n - 1       && i === m + n - 1 )        return -1
            if ( m >= n         && m <= 2 * n - 1   && i === m + 2 * n - 2 )    return -1
            // Ток втекает из узла сверху
            if ( m >= n         && m <= 2 * n - 1   && i === m - 1 )            return 1
            if ( m >= 2 * n     && m <= 3 * n - 1   && i === m + n - 2 )        return 1
            return 0
        })
    })
    return graph
}

function createR (wb, wt, clampV, clampH, cont, len) {
    const cb = cont / 2
    const ct = cont / 2
    let R = new Array (len)
    R.fill(len)
    const x = Math.floor((len - 2) / 5)
    R = R.map((el,i) => {
      if (i <= x - 1) return wt / x
      if (i <= 2 * x) return ct * (x + 1) + clampV * (x + 1) / 2
      if (i <= 3 * x) return clampH / x
      if (i <= 4 * x + 1) return cb * (x + 1) + clampV * (x + 1) / 2
      if (i <= 5 * x + 1) return wb / x
      return undefined
    })
    return R    
}


const convection = function convection (
  v = 10,
  t = 293.15,
  d = 0.05,
  p = 101325
) {
  let Vwind = v
  let Dcyl = d
  let Tair = t
  let pA = p
  function kAir (T) {
    if (T > 1000) {
      return kAir(1000)
    }
    if (T < 70) {
      return kAir(70)
    }
    return (
      -8.404165e-4 +
      1.107418e-4 * T -
      8.635537e-8 * T ** 2 +
      6.31411e-11 * T ** 3 -
      1.88168e-14 * T ** 4
    )
  }
  function cpAir (T) {
    if (T < 100) {
      return cpAir(100)
    }
    if (T < 375) {
      return (
        1010.97 +
        0.0439479 * T ** 1 -
        2.922398e-4 * T ** 2 +
        6.503467e-7 * T ** 3
      )
    }
    if (T < 1300) {
      return (
        1093.29 -
        0.6355521 * T ** 1 +
        0.001633992 * T ** 2 -
        1.412935e-6 * T ** 3 +
        5.59492e-10 * T ** 4 -
        8.663072e-14 * T ** 5
      )
    }
    if (T <= 3000) {
      return (
        701.0807 +
        0.8493867 * T ** 1 -
        5.846487e-4 * T ** 2 +
        2.302436e-7 * T ** 3 -
        4.846758e-11 * T ** 4 +
        4.23502e-15 * T ** 5
      )
    }
    return cpAir(3000)
  }
  function rhoAir (press, T) {
    if (T <= 80) {
      return 352.716 * 80 ** -1
    }
    if (T <= 3000) {
      return 352.716 * T ** -1
    }
    return 352.716 * 3000 ** -1
  }
  function etaAir (T) {
    if (T < 120) {
      return etaAir(120)
    }
    if (T < 600) {
      return (
        -1.132275e-7 +
        7.94333e-8 * T ** 1 -
        7.197989e-11 * T ** 2 +
        5.158693e-14 * T ** 3 -
        1.592472e-17 * T ** 4
      )
    }
    if (T <= 2150) {
      return (
        3.892629e-6 +
        5.75387e-8 * T ** 1 -
        2.675811e-11 * T ** 2 +
        9.709691e-15 * T ** 3 -
        1.355541e-18 * T ** 4
      )
    }
    return etaAir(2150)
  }
  function Re (Tinp) {
    return (rhoAir(pA, Tinp) * Vwind * Dcyl) / etaAir(Tinp)
  }
  function Pr (Tinp) {
    return (etaAir(Tinp) * cpAir(Tinp)) / kAir(Tinp)
  }
  function hConvFunc (Tinp, v1, t1, d1, p1) {
    if (v1 !== undefined) {
      Vwind = v1
    }
    if (d1 !== undefined) {
      Dcyl = d1
    }
    if (t1 !== undefined) {
      Tair = t1
    }
    if (p1 !== undefined) {
      pA = p1
    }
    const Tfilm = (Tinp + Tair) / 2
    const Hc =
      (kAir(Tfilm) *
        (0.3 +
          (0.62 *
            Math.sqrt(Re(Tfilm)) *
            Pr(Tfilm) ** (1 / 3) *
            (1 + 0.0003922783206 * Re(Tfilm) ** 0.625) ** 0.8) /
            (1 + 0.5428835233 * (1 / Pr(Tfilm)) ** (2 / 3)) ** 0.25)) /
      Dcyl
    return Hc
  }

  const hConvObj = {
    setCondition: function setCondition (
      v1 = Vwind,
      t1 = Tair,
      d1 = Dcyl,
      p1 = pA
    ) {
      Vwind = v1
      Dcyl = d1
      Tair = t1
      pA = p1
    },
  }
  return Object.assign(hConvFunc, hConvObj)
}

export function convectionObj (obj) {
  const Tair = obj.Tair.unit === 'К' ? obj.Tair.value : obj.Tair.value + 273.15
  return convection(obj.Vwind.value, Tair, obj.Dcyl.value)
}

export default convection

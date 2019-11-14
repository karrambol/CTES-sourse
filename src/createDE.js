export default function initClampDE(t, iC, iL, hConv, c, obj) {
  const delta = 5.670367e-8 // Постоянная Стефана — Больцмана
  const alpha = obj.alpha.value //
  const Tref = obj.Tref.value
  const Fz = 0.012747731984462128 // Взято из геометрии
  const Tair = t
  const varEpsilon = 0.6
  return function DE(x, y1 = [0]) {
    const [y] = y1
    const E = c.Es([iC(x), iL(x)]) * (1 + alpha * (Tair + y - Tref))

    const Qconv = hConv(y + Tair) * Fz * y
    const Qrad = varEpsilon * Fz * delta * ((y + Tair) ** 4 - Tair ** 4)
    const Qtot = Qconv + Qrad

    const rez = (E - Qtot) / 255.62151205326109
    // console.log(
    //     y,
    //     E,
    //     hConv( y + Tair ),
    //     Qconv,
    //     Qrad,
    //     Qtot
    // )
    return [rez]
  }
}

export default function initClampDE (t, iC, iL, hConv, c, obj) {
  const delta = 5.670367e-8 // Постоянная Стефана — Больцмана
  const alpha = obj.alpha.value // Температурная постоянная сопротивления
  const Tref = obj.Tref.units === 'K' ? obj.Tref.value : obj.Tref.value + 273.15
  const Fz = obj.Fc.value // Площадь внешней поверхности зажима
  const Tair = t
  const epsilon = obj.epsilon.value // Коэффициент черноты поверхности
  return function DE (x, y1 = [0]) {
    const [y] = y1
    const E = c.Es([iC(x), iL(x)]) * (1 + alpha * (Tair + y - Tref))
    const Qconv = hConv(y + Tair) * Fz * y
    const Qrad = epsilon * Fz * delta * ((y + Tair) ** 4 - Tair ** 4)
    const Qtot = Qconv + Qrad
    const rez = (E - Qtot) / 255.62151205326109
    return [rez]
  }
}

const convection = function convection (v = 1, d = 10, t = 20, p = 101325) {
    let Vwind = v;
    let Dcyl = d;
    let Tair = t;
    let pA = p;
    function kAir(T) {
        if (T > 1000) {
            return kAir(1000);
        }
        if (T < 70) {
            return kAir(70);
        }
        return -8.404165E-4 + 1.107418E-4 * T ** 1 - 8.635537E-8 * T ** 2 + 6.31411E-11 * T ** 3 - 1.88168E-14 * T ** 4;
    }
    function cpAir(T) {
        if (T < 100) {
            return cpAir(100);
        }
        if (T < 375) {
            return 1010.97 + 0.0439479 * T ** 1 - 2.922398E-4 * T ** 2 + 6.503467E-7 * T ** 3;
        }
        if (T < 1300) {
            return 1093.29 - 0.6355521 * T ** 1 + 0.001633992 * T ** 2 - 1.412935E-6 * T ** 3 + 5.59492E-10 * T ** 4 - 8.663072E-14 * T ** 5;
        }
        if (T <= 3000) {
            return 701.0807 + 0.8493867 * T ** 1 - 5.846487E-4 * T ** 2 + 2.302436E-7 * T ** 3 - 4.846758E-11 * T ** 4 + 4.23502E-15 * T ** 5;
        }
        return cpAir(3000);
    }
    function rhoAir(press, T) {
        if (T <= 80) {
            return 352.716 * 80 ** (-1);
        }
        if (T <= 3000) {
            return 352.716 * T ** (-1);
        }
        return 352.716 * 3000 ** (-1);
    }
    function etaAir(T) {
        if (T < 120) {
            return etaAir(120);
        }
        if (T < 600) {
            return -1.132275E-7 + 7.94333E-8 * T ** 1 - 7.197989E-11 * T ** 2 + 5.158693E-14 * T ** 3 - 1.592472E-17 * T ** 4;
        }
        if (T <= 2150) {
            return 3.892629E-6 + 5.75387E-8 * T ** 1 - 2.675811E-11 * T ** 2 + 9.709691E-15 * T ** 3 - 1.355541E-18 * T ** 4;
        }
        return etaAir(2150);
    }
    function Re(Tinp) {
        return rhoAir(pA, Tinp) * Vwind * Dcyl / etaAir(Tinp);
    }
    function Pr(Tinp) {
        return etaAir(Tinp) * cpAir(Tinp) / kAir(Tinp);
    }
    // eslint-disable-next-line no-underscore-dangle
    function hConvFunc (Tinp,v1,d1,t1,p1) {
        if (v1) {Vwind = v1}
        if (d1) {Dcyl = d1}
        if (t1) {Tair = t1}
        if (p1) {pA = p1}
        const Tfilm = (Tinp + Tair) / 2;
        const Hc = kAir(Tfilm) * (0.3 + 0.62 * Math.sqrt(Re(Tfilm)) * Pr(Tfilm) ** (1 / 3) * (1 + 0.0003922783206 * Re(Tfilm) ** 0.625) ** 0.8 / (1 + 0.5428835233 * (1 / Pr(Tfilm)) ** (2 / 3)) ** 0.25) / Dcyl;
        return Hc;
    }
    const hConvObj = {
        setCondition: function setCondition (v1 = Vwind, d1 = Dcyl, t1 = Tair, p1 = pA) {
            Vwind = v1;
            Dcyl = d1;
            Tair = t1;
            pA = p1;
        }
    }
    return Object.assign(hConvFunc,hConvObj);
}

export default convection;
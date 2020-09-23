import { writable, derived } from 'svelte/store';

export const resistance = writable({
  Rc: {
    name: 'Rc',
    value: '16,116,216,316',
    units: 'мкОм',
    description: 'Переходное сопротивление',
  },
  n: { name: 'n', value: 30, units: '1', description: 'Вертикальных ветвей' },
  Rwb: {
    name: 'Rwb',
    value: '12.462508462681646',
    units: 'мкОм',
    description: 'Сопротивление нижнего провода',
  },
  Rwt: {
    name: 'Rwt',
    value: '13.324356266166885',
    units: 'мкОм',
    description: 'Сопротивление верхнего провода',
  },
  Rv: {
    name: 'Rv',
    value: '1.39080899410521',
    units: 'мкОм',
    description: 'Сопротивление зажима вертикальное',
  },
  Rh: {
    name: 'Rh',
    value: '7.219355450344615',
    units: 'мкОм',
    description: 'Сопротивление зажима горизонтальное',
  },
});

export const loads = writable({
  options: [
    { name: 'const', description: 'Постоянная' },
    { name: 'step', description: 'Ступенчатая' },
    { name: 'linear', description: 'Линейная' },
  ],
  loads: [
    {
      name: 'i',
      option: 'const',
      values: [{ t: '0', i: '1000' }],
      units: ['с', 'А'],
      description: 'Продольный ток',
    },
    {
      name: 'i2',
      option: 'linear',
      values: [
        { t: '0', i: '0' },
        { t: '2000', i: '0' },
        { t: '2010', i: '1050' },
        { t: '2020', i: '0' },
      ],
      units: ['с', 'А'],
      description: 'Поперечный ток',
    },
  ],
});

export const thermal = writable({
  Vwind: { name: 'Vw', value: 10, units: 'м/с', description: 'Скорость ветра' },
  Tair: {
    name: 'Tair',
    value: '20',
    units: '°С',
    description: 'Температура воздуха',
  },
  epsilon: {
    name: 'ε',
    value: '0.6',
    units: '1',
    description: 'Коэффициент излучения',
  },
  Dcyl: { name: 'Dc', value: 0.05, units: 'м', description: 'Высота зажима' },
  Fc: {
    name: 'Fc',
    value: '0.012747731984462128',
    units: 'м^2',
    description: 'Площадь поверхности зажима',
  },
  alpha: {
    name: 'α',
    value: '0.0039',
    units: '1/К',
    description: 'Температурный коэф. сопротивления',
  },
  Tref: {
    name: 'Tref',
    value: '298',
    units: 'K',
    description: 'Исходная температура сопротивления',
  },
});
export const solver = writable({
  name: 's',
  values: [
    { id: 0, t: '2000', step: '10' },
    { id: 1, t: '2020', step: '0.5' },
    { id: 2, t: '', step: '' },
  ],
  units: ['с', 'c'],
  description: 'Настройки шага решателя',
});
export const task = derived(
  [thermal, resistance, solver],
  ([$thermal, $resistance, $solver]) => {
    return {
      Vwind: $thermal.Vwind,
      Rc: $resistance.Rc,
      Tair: $thermal.Tair,
      n: $resistance.n,
      tn: {
        name: 't',
        value: $solver.values[$solver.values.length - 2].t,
        units: 'с',
        description: 'Конец расчета',
      },
    };
  }
);
export const results = writable([]);
export const plottedResult = writable(0);
export const selectedResults = writable([]);

export const result = derived(
  [results, plottedResult],
  ([$results, $plottedResult]) => {
    if ($results[$plottedResult]) {
      return {
        T: $results[$plottedResult].result.map(function mapEl1 (el) {
          return {
            x: el[0],
            y: el[1],
          };
        }),
        E: $results[$plottedResult].result.map(function mapEl2 (el) {
          return {
            x: el[0],
            y: el[2],
          };
        }),
        I1: $results[$plottedResult].result.map(function mapEl3 (el) {
          return {
            x: el[0],
            y: el[3],
          };
        }),
        I2: $results[$plottedResult].result.map(function mapEl4 (el) {
          return {
            x: el[0],
            y: el[4],
          };
        }),
      };
    }
    return [];
  }
);

/*
Подобранные сопротивления:
123. [1.4439689611700675, 9.210005262268119] err = 0.04 % n = 30, 297 evals, tol

29. [1.39080899,7.21935545] err = 0.02 % n = 60, 66 evals, maxstep
[1.39080899410521, 7.219355450344615]



*/

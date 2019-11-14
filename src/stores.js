import { writable, derived } from 'svelte/store'

export const taskData = writable([
  { name: 'Vw', value: 10, units: 'м/с', description: 'Скорость ветра' },
  {
    name: 'Rc',
    value: '16,20,30,300',
    units: 'мкОм',
    description: 'Переходное сопротивление',
  },
  { name: 'T', value: 20, units: '°С', description: 'Температура воздуха' },
  {
    name: 't',
    value: 2000,
    units: 'c',
    description: 'Расчётное время с шагом 10 с',
  },
  {
    name: 't2',
    value: 200,
    units: 'c',
    description: 'Расчётное время с шагом 1 с',
  },
])

export const resistance = writable({
  Rc: {
    name: 'Rc',
    value: '16, 20, 30, 300',
    units: 'мкОм',
    description: 'Переходное сопротивление',
  },
  n: { name: 'n', value: 60, units: '1', description: 'Вертикальных ветвей' },
  Rwb: {
    name: 'Rwb',
    value: 12.462508462681646,
    units: 'мкОм',
    description: 'Сопротивление нижнего провода',
  },
  Rwt: {
    name: 'Rwt',
    value: 13.324356266166885,
    units: 'мкОм',
    description: 'Сопротивление верхнего провода',
  },
  Rv: {
    name: 'Rv',
    value: 1.39080899410521,
    units: 'мкОм',
    description: 'Сопротивление зажима вертикальное',
  },
  Rh: {
    name: 'Rh',
    value: 7.219355450344615,
    units: 'мкОм',
    description: 'Сопротивление зажима горизонтальное',
  },
})
export const task = derived(
  [taskData, resistance],
  ([$taskData, $resistance]) => {
    return {
      Vwind: $taskData[0],
      Rc: $resistance.Rc,
      Tair: $taskData[2],
      n: $resistance,
      tn: $taskData[3],
      tn2: $taskData[4],
    }
  }
)

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
        { t: '2100', i: '1050' },
        { t: '2200', i: '0' },
      ],
      units: ['с', 'А'],
      description: 'Поперечный ток',
    },
  ],
})

export const thermal = derived(task, $task => {
  return {
    Vwind: $task.Vwind,
    deltaKC: { name: 'deltaKC', value: 273.15, units: 'К' },
    pA: { name: 'pA', value: 101325, units: 'Па' },
    alpha: { name: 'alpha', value: 3.9e-3, units: '1/К' },
    Tair: $task.Tair,
    Dcyl: { name: 'Dcyl', value: 0.05, units: 'м' },
    Tref: { name: 'Tref', value: 298, units: 'К' },
  }
})

export const results = writable([])
export const currentResult = writable(0)

export const result = derived(
  [results, currentResult],
  ([$results, $currentResult]) => {
    if ($results[$currentResult]) {
      return {
        T: $results[$currentResult].result.map(function mapEl1(el) {
          return {
            x: el[0],
            y: el[1],
          }
        }),
        E: $results[$currentResult].result.map(function mapEl2(el) {
          return {
            x: el[0],
            y: el[2],
          }
        }),
        I1: $results[$currentResult].result.map(function mapEl3(el) {
          return {
            x: el[0],
            y: el[3],
          }
        }),
        I2: $results[$currentResult].result.map(function mapEl4(el) {
          return {
            x: el[0],
            y: el[4],
          }
        }),
      }
    }
    return []
  }
)

/*
Подобранные сопротивления:
123. [1.4439689611700675, 9.210005262268119] err = 0.04 % n = 30, 297 evals, tol

29. [1.39080899,7.21935545] err = 0.02 % n = 60, 66 evals, maxstep
[1.39080899410521, 7.219355450344615]



*/

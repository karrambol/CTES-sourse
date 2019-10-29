/* eslint-disable prefer-const */
/* eslint-disable no-console */
import Chart from 'chart.js';
import App from './App.svelte';
import { Solver } from './odex';
import  convection  from './hConv';
import { c as Circuit } from './circuit';

const app = new App({
	target: document.body,
	props: {
		params: [
            {name:'Vwind', value: 10, units: 'м/с'},
            {name:'Rcont', value: 16, units: 'мкОм'},
            {name:'Tair', value: 20, units: '&#176;С'},
            {name:'i', value: 200, units: 'А'}
        ]
	}
});
console.log(app)
const deltaKC = 273.15;
const pA = 101325;
const alpha = 3.9e-3;
let Tair = 20 + deltaKC;
let Dcyl = 0.050;
let Tref = 298;
let Rwb = 12.32E-6;
let Rwt = 13.88E-6;
let Rclampv = 1.85485E-6;
let Rclamph = 6.69332E-6;
let iCJ = [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
let iLJ = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
let a = [   [ -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 1, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 1, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 1, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 1, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0 ],
            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 ] ];
let tn = 2000

const s = new Solver(1);
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
const hConv = convection(10,Dcyl,Tair,pA)
const c = new Circuit(createR(Rwb,Rwt,Rclampv,Rclamph,16E-6,a[0].length),a,[iCJ,iLJ]);

function iC (arg) {
    if (arg > tn && arg < tn + 100) {return 1000}
    return 0
};
function iL (arg) {
  if (arg <= tn) {return 1000}
  return 0
};

function initClampDE () {
    let delta = 5.67e-8;    
    let Fz2 = 0.012739; // Взято из геометрии
    let varEpsilon = 0.6
    return function DE (x, y) { 
        [y]=y
        let rez = (c.E([iC(x),iL(x)])*(1 + alpha*(Tair + y - Tref)) - (hConv(y + Tair)*Fz2*y + varEpsilon*Fz2*delta*((y + Tair)**4 - (Tair)**4)))/(255.45330827465403);
        return [rez]
    };
}
const f = initClampDE()

const result = [[0, 0, 10.53697116713672, 0, 1000]];





const config = {
    type: 'line',
    data: {
        datasets: [{
            label: 'Перегрев зажима над окружающей средой q(t), \u00B0C',
            backgroundColor: 'red',
            borderColor: 'red',
            data: result.map((el) =>{ 
                return {
                    x: el[0].toFixed(2), 
                    y: el[1].toFixed(2)
                }
            }),
            borderWidth: 3,
            fill: false,
        }, {
            label: 'Энергия E, Вт',
            fill: false,
            backgroundColor: 'blue',
            borderColor: 'blue',
            data: result.map((el) =>{ 
                return {
                    x: el[0].toFixed(2), 
                    y: el[2].toFixed(2)
                }
            }),
        }]
    },
    options: {
        maintainAspectRatio: false,
        backgroundColor: 'white',
        responsive: true,
        layout: {
            padding: {
                left: 15,
                right: 0,
                top: 0,
                bottom: 0
            }
        },
        title: {
            display: false,
            text: 'Результат расчета'
        },
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
                type: 'linear',
                scaleLabel: {
                    display: true,
                    labelString: 'Время, с'
                },
                ticks: {
                    beginAtZero: true,
                    suggestedMax: tn * 2
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Value'
                },
                ticks: {
                    beginAtZero: true,
                    suggestedMax: 30
                }
            }]
        }
    }
};
const config2 = {
    type: 'line',
    data: {
        datasets: [{
            label: 'Поперечный ток Ic, A',
            backgroundColor: 'rgba(255,0,0,0.3)',
            borderColor: 'rgba(255,0,0,1)',
            data: result.map((el) =>{ 
                return {
                    x: el[0], 
                    y: el[3]
                }
            }),
            fill: true,
        }, {
            label: 'Продольный ток Il, A',
            fill: true,
            backgroundColor: 'rgba(0,0,255,0.3)',
            borderColor: 'rgba(0,0,255,1)',
            data: result.map((el) =>{ 
                return {
                    x: el[0], 
                    y: el[4]
                }
            }),
        }]
    },
    options: {
        maintainAspectRatio: false,
        height: '200px',
        backgroundColor: 'white',
        borderColor: 'black',
        responsive: true,
        layout: {
            padding: {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            }
        },
        title: {
            display: false,
            text: 'Chart.js Line Chart'
        },
        legend: {
            position: 'bottom'
        },
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
                type: 'linear',
                scaleLabel: {
                    display: true,
                    labelString: 'Время, с'
                },
                ticks: {
                    beginAtZero: true,
                    suggestedMax: tn * 2
                }
            }],
            yAxes: [{
                display: true,
                ticks: {
                    maxTicksLimit: 8,
                    beginAtZero: true,
                    suggestedMax: 1000
                },
                scaleLabel: {
                    display: true,
                    labelString: 'I, А'
                }
            }]
        }
    }
};
let dataChart;
let currentChart;

Chart.defaults.global.elements.point.hoverRadius = 7;
const ctx = document.getElementById('dataChart').getContext('2d')
dataChart = new Chart(ctx, config);
const ctx2 = document.getElementById('currentChart').getContext('2d')
currentChart = new Chart(ctx2, config2);
function* foo(){
    let index = 0;
    while(index <= 2)
      yield index++; // yield будет прерывать работу функции на этом месте
}
function updCharts (input) {
    dataChart.data.datasets[0].data.push({
        x: input[0].toFixed(2), 
        y: input[1].toFixed(2)
    })
    dataChart.data.datasets[1].data.push({
        x: input[0].toFixed(2), 
        y: input[2].toFixed(2)
    })
    dataChart.update();
    currentChart.data.datasets[0].data.push({
        x: input[0].toFixed(2), 
        y: input[3].toFixed(2)
    })
    currentChart.data.datasets[1].data.push({
        x: input[0].toFixed(2), 
        y: input[4].toFixed(2)
    })
    currentChart.update();
}
let prevPoint = 0;
function collectValues (n,x0,x1,y) {
    const collect = [x1,y[0],c.E([iC(x1),iL(x1)])*(1 + alpha*(Tair + y[0] - Tref)),iC(x1),iL(x1)]
    result.push(collect);
    setTimeout(() => {
        updCharts(collect)
    }, prevPoint + collect[2] ** 3 / 300);
    prevPoint += collect[2] ** 3 / 300
};
const start = new Date();
s.denseOutput = true;  
s.solve(f, 0, 0, tn*2, s.grid(5, function collectResult(x1,y) {
    collectValues (null,null,x1,y)
}));
const end = new Date();
console.log('Время расчета:',end-start)
console.log(result)

export default app;







// s.denseOutput = false;  
// s.solve(f, 0, [0], tn, collectValues)
// let [nextStartX] = result[result.length - 1]
// let nextStartY = [result[result.length - 1][1]]
// s.denseOutput = true;  
// s.solve(f, nextStartX, nextStartY, tn + 100, s.grid(1, function collectResult(x1,y) {
//     collectValues (null,null,x1,y)
// }));
// s.denseOutput = false;  
// [nextStartX] = result[result.length - 1]
// nextStartY = [result[result.length - 1][1]]
// s.solve(f, nextStartX, nextStartY, tn * 2, collectValues)
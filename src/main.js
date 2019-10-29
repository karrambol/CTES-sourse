/* eslint-disable no-unused-vars */
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
let Tair = 20 + deltaKC;
let Dcyl = 0.050;
let Vwind = 10;
let Rwb = 12.32E-6;
let Rwt = 13.88E-6;
const alpha = 3.9e-3;
let Tref = 298;
let Rclampv = 1.85485E-6;
let Rclamph = 6.69332E-6;
// Rclampv = 1.35226E-6,
// Rclamph = 30.2724E-6,
// Rclampv = 1.35177E-6,
// Rclamph = 30.2907E-6,
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
function arrToString (arr) {
    return `[${  arr.map(el => `[${  el  }]`).join(', ')  }]`
}
const s = new Solver(1);
function createR (wb,wt,clampV,clampH,cont, len) {
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
    if (arg <= tn) {return 0}
    if (arg < tn + 100) {return 1000}
    if (arg <= 10000){return 0}
    if (arg <=12000){return 0}
    if (arg <=13000){return 0}
    if (arg <=13200){return 0}
    return 0
};
function iL (arg) {
  if (arg <= tn) {return 1000}
  if (arg <= 11000){return 0}
  if (arg <=12000){return 0}
  if (arg <=13000){return 0}
  return 0
};

function initClampDE () {
    let c1 = 390;   
    let c2 = 423;                
    let m1 = 0.131;             
    let m2 = 0.471;
    let delta = 5.67e-8;    
    let Fz2 = 0.012739; // Взято из геометрии
    let Tamb = 20;
    let varEpsilon = 0.6
    return function DE (x, y) { 
        [y]=y
        let rez = (c.E([iC(x),iL(x)])*(1 + alpha*(Tair + y - Tref)) - (hConv(y + Tair)*Fz2*y + varEpsilon*Fz2*delta*((y + Tair)**4 - (Tair)**4)))/(255.45330827465403);
        return [rez]
    };
}
const f = initClampDE()


const result = [];

function collectValues (n,x0,x1,y) {
    const collect = [x1,y[0],c.E([iC(x1),iL(x1)])*(1 + alpha*(Tair + y[0] - Tref)),iC(x1),iL(x1)]
    result.push(collect);
}

s.relativeTolerance = 1E-10
s.absoluteTolerance = 1E-10

const start = new Date();
s.denseOutput = false;  
s.solve(f, 0, [0], tn, collectValues)

let [nextStartX] = result[result.length - 1]
let nextStartY = [result[result.length - 1][1]]

s.denseOutput = true;  
s.solve(f, nextStartX, nextStartY, tn + 100, s.grid(1, function collectResult(x1,y) {
    collectValues (null,null,x1,y)
}));
s.denseOutput = false;  
[nextStartX] = result[result.length - 1]
nextStartY = [result[result.length - 1][1]]
s.solve(f, nextStartX, nextStartY, tn * 2, collectValues)

// s.solve(f, 0, [0], tn * 2, function(n,x0,x1,y) {
//     // let collect = [x1,y[0],1000*f(x1,y)[0],iC(x1)/1000,iL(x1)/1000]
//     let collect = [x1,y[0],c.E([iC(x1),iL(x1)])*(1 + alpha*(Tair + y[0] - Tref)),iC(x1),iL(x1)]
//     // console.log(collect)
//     result.push(collect);
// }).y

const end = new Date();
console.log('time',end-start)
// s.denseOutput = true;  // request interpolation closure in solution callback
// s.solve(f, 0, [0], 10000, s.grid(15, function(x,y) {
    //   console.log(x,y,f(x,y));
const arrTestI = [1000,0]
console.log(c.U0(arrTestI)())
console.log('I',c.I(arrTestI)()[24])
console.log(c.U0(arrTestI)()[0]*1000)
console.log(c.U0(arrTestI)()[12]*1000)
console.log(c.U0(arrTestI)()[12]*1000 - c.U0(arrTestI)()[0]*1000)

// import Chart from 'chart.js';

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
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Value'
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
                }
            }],
            yAxes: [{
                display: true,
                ticks: {
                    maxTicksLimit: 8
                },
                scaleLabel: {
                    display: true,
                    labelString: 'I, А'
                }
            }]
        }
    }
};
window.onload = function drawChart () {
    Chart.defaults.global.elements.point.hoverRadius = 7;
    const ctx = document.getElementById('dataChart').getContext('2d')
    window.dataChart = new Chart(ctx, config);
    const ctx2 = document.getElementById('currentChart').getContext('2d')
    window.currentChart = new Chart(ctx2, config2);
    // ctx.canvas.parentNode.style.height = '800px';
    // ctx2.canvas.parentNode.style.height = '200px';
}
export default app;
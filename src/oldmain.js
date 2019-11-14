/* eslint-disable no-console */
import App from './App.svelte'
// import Chart from 'chart.js';
// import { get } from 'svelte/store';
// import { Solver } from './odex';
// import  {convectionObj}  from './hConv';
// import { task, resistance, thermal} from './stores';
// import createCircuit, { NMSearchVH } from './createCircuit';
// import initClampDE from './createDE';

const app = new App({
  target: document.body,
  props: {},
})

// const deltaKC = 273.15;
// const alpha = 3.9e-3;
// const Tair = 20 + deltaKC;
// const Tref = 298;
// const tn = 2000

// function iC (arg) {
//     if (arg > tn && arg < tn + 100) {return get(task).i.value}
//     return 0
// };
// function iL (arg) {
//     if (arg <= tn) {return get(task).i.value}
//     return 0
// };

// const s = new Solver(1);
// const hConv = convectionObj(get(thermal))
// const c = createCircuit(get(resistance))
// const f = initClampDE(Tair, iC, iL, hConv, c, get(thermal))

// const result = [[0, 0, c.E([iC(0), iL(0)]) * (1 + alpha*(Tair - Tref)), 0, get(task).i.value]];

// const config = {
//     type: 'line',
//     data: {
//         datasets: [{
//             label: 'Перегрев зажима над окружающей средой q(t), \u00B0C',
//             backgroundColor: 'red',
//             borderColor: 'red',
//             pointHoverBorderColor: 'blue',
//             pointHoverBackgroundColor: 'blue',
//             data: result.map((el) =>{
//                 return {
//                     x: el[0].toFixed(2),
//                     y: el[1].toFixed(2)
//                 }
//             }),
//             borderWidth: 3,
//             fill: false,
//         },
//         {
//             label: 'Энергия E, Вт',
//             fill: false,
//             pointHoverBorderColor: 'red',
//             pointHoverBackgroundColor: 'red',
//             backgroundColor: 'blue',
//             borderColor: 'blue',
//             data: result.map((el) =>{
//                 return {
//                     x: el[0].toFixed(2),
//                     y: el[2].toFixed(2)
//                 }
//             }),
//         }]
//     },
//     options: {
//         maintainAspectRatio: false,
//         backgroundColor: 'white',
//         responsive: true,
//         layout: {
//             padding: {
//                 left: 5,
//                 right: 0,
//                 top: 0,
//                 bottom: 0
//             }
//         },
//         title: {
//             display: false,
//             text: 'Результат расчета'
//         },
//         tooltips: {
//             mode: 'index',
//             intersect: false,
//         },
//         hover: {
//             mode: 'nearest',
//             intersect: true
//         },
//         scales: {
//             xAxes: [{
//                 display: true,
//                 type: 'linear',
//                 scaleLabel: {
//                     display: true,
//                     labelString: 'Время, с'
//                 },
//                 ticks: {
//                     beginAtZero: true,
//                     suggestedMax: tn * 2
//                 }
//             }],
//             yAxes: [{
//                 display: true,
//                 scaleLabel: {
//                     display: true,
//                     labelString: 'Value'
//                 },
//                 ticks: {
//                     beginAtZero: true,
//                     suggestedMax: 30
//                 }
//             }]
//         }
//     }
// };
// const config2 = {
//     type: 'line',
//     data: {
//         datasets: [{
//             label: 'Поперечный ток Ic, A',
//             backgroundColor: 'rgba(255,0,0,0.3)',
//             borderColor: 'rgba(255,0,0,1)',
//             data: result.map((el) =>{
//                 return {
//                     x: el[0],
//                     y: el[3]
//                 }
//             }),
//             fill: true,
//         }, {
//             label: 'Продольный ток Il, A',
//             fill: true,
//             backgroundColor: 'rgba(0,0,255,0.3)',
//             borderColor: 'rgba(0,0,255,1)',
//             data: result.map((el) =>{
//                 return {
//                     x: el[0],
//                     y: el[4]
//                 }
//             }),
//         }]
//     },
//     options: {
//         maintainAspectRatio: false,
//         height: '200px',
//         backgroundColor: 'white',
//         borderColor: 'black',
//         responsive: true,
//         layout: {
//             padding: {
//                 left: 0,
//                 right: 0,
//                 top: 0,
//                 bottom: 0
//             }
//         },
//         title: {
//             display: false,
//             text: 'Chart.js Line Chart'
//         },
//         legend: {
//             position: 'bottom'
//         },
//         tooltips: {
//             mode: 'index',
//             intersect: false,
//         },
//         hover: {
//             mode: 'nearest',
//             intersect: true
//         },
//         scales: {
//             xAxes: [{
//                 display: true,
//                 type: 'linear',
//                 scaleLabel: {
//                     display: true,
//                     labelString: 'Время, с'
//                 },
//                 ticks: {
//                     beginAtZero: true,
//                     suggestedMax: tn * 2
//                 }
//             }],
//             yAxes: [{
//                 display: true,
//                 ticks: {
//                     maxTicksLimit: 8,
//                     beginAtZero: true,
//                     suggestedMax: 1000
//                 },
//                 scaleLabel: {
//                     display: true,
//                     labelString: 'I, А'
//                 }
//             }]
//         }
//     }
// };

// Chart.defaults.global.elements.point.hoverRadius = 7;
// const ctx = document.getElementById('dataChart').getContext('2d')
// const dataChart = new Chart(ctx, config);
// const ctx2 = document.getElementById('currentChart').getContext('2d')
// const currentChart = new Chart(ctx2, config2);

// function updCharts (input) {
//     dataChart.data.datasets[0].data.push({
//         x: input[0].toFixed(2),
//         y: input[1].toFixed(2)
//     })
//     dataChart.update();
//     dataChart.data.datasets[1].data.push({
//         x: input[0].toFixed(2),
//         y: input[2].toFixed(2)
//     })
//     dataChart.update();
//     currentChart.data.datasets[0].data.push({
//         x: input[0].toFixed(2),
//         y: input[3].toFixed(2)
//     })
//     currentChart.update();
//     currentChart.data.datasets[1].data.push({
//         x: input[0].toFixed(2),
//         y: input[4].toFixed(2)
//     })
//     currentChart.update();
// }

// function updChartNM (input) {
//     dataChart.data.datasets[2].data.push({
//         x: input[0],
//         y: input[1]
//     })
//     dataChart.update();
// }
// function collectValues (n,x0,x1,y) {
//     const collect = [x1,y[0],c.E([iC(x1),iL(x1)])*(1 + alpha*(Tair + y[0] - Tref)),iC(x1),iL(x1)]
//     result.push(collect);
//     updCharts(collect)
// };

// const start = new Date();
//     s.denseOutput = false;
//     s.absoluteTolerance = 1e-16
//     s.relativeTolerance = 1e-12
//     s.solve(f, 0, [0], tn, collectValues)
//     let [nextStartX] = result[result.length - 1]
//     let nextStartY = [result[result.length - 1][1]]
//     s.denseOutput = true;
//     s.solve(f, nextStartX, nextStartY, tn + 100, s.grid(1, function collectResult(x1,y) {
//         collectValues (null,null,x1,y)
//     }));
//     s.denseOutput = false;
//     [nextStartX] = result[result.length - 1]
//     nextStartY = [result[result.length - 1][1]]
//     s.solve(f, nextStartX, nextStartY, tn * 2, collectValues)
// const end = new Date();
// console.log('Время расчета:',end-start)

// window.onload = function wol () {
//     function optimize () {
//         dataChart.data.datasets.push({
//             label: 'Ошибка, %',
//             fill: false,
//             backgroundColor: 'green',
//             borderColor: 'green',
//             data: []
//             })
//         const rez = NMSearchVH(get(resistance), (itr, x, objF,centr,action,objEvals) => {
//             updChartNM([itr * 100, objF > 0.2? 20 : objF * 100])
//             console.log(`${itr}. [${x[0].toFixed(8)},${x[1].toFixed(8)}] err = ${(objF * 100).toFixed(2)} % n = ${get(task).n.value}, ${objEvals} evals, ${action}`)
//         })
//         console.log(rez)
//     }
//     // setTimeout(() => {optimize()},1);
//     // optimize();
// }

export default app

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

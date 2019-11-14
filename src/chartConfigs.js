export const dataConfig = {
  type: 'line',
  data: {
    datasets: [
      {
        label: 'Перегрев зажима над окружающей средой q(t), \u00B0C',
        backgroundColor: 'red',
        borderColor: 'red',
        pointHoverBorderColor: 'red',
        pointHoverBackgroundColor: 'white',
        data: [],
        borderWidth: 3,
        fill: false,
      },
      {
        label: 'Энергия E, Вт',
        fill: false,
        backgroundColor: 'blue',
        borderColor: 'blue',
        pointHoverBorderColor: 'blue',
        pointHoverBackgroundColor: 'white',
        data: [],
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    backgroundColor: 'white',
    responsive: true,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    title: {
      display: false,
      text: 'Результат расчета',
    },
    tooltips: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgb(0, 121, 107)',
    },
    hover: {
      mode: 'index',
      intersect: false,
      animationDuration: 0,
    },
    animation: {
      duration: 0,
    },
    responsiveAnimationDuration: 0,
    scales: {
      xAxes: [
        {
          display: true,
          type: 'linear',
          scaleLabel: {
            display: true,
            labelString: 'Время, с',
          },
          ticks: {
            beginAtZero: true,
          },
        },
      ],
      yAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Value',
          },
          ticks: {
            beginAtZero: true,
            // suggestedMax: 30
          },
        },
      ],
    },
  },
}
export const currentConfig = {
  type: 'line',
  data: {
    datasets: [
      {
        label: 'Поперечный ток Ic, A',
        backgroundColor: 'rgba(255,0,0,0.3)',
        borderColor: 'rgba(255,0,0,1)',
        data: [],
        fill: true,
      },
      {
        label: 'Продольный ток Il, A',
        fill: true,
        backgroundColor: 'rgba(0,0,255,0.3)',
        borderColor: 'rgba(0,0,255,1)',
        data: [],
      },
    ],
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
        bottom: 0,
      },
    },
    title: {
      display: false,
      text: 'Chart.js Line Chart',
    },
    legend: {
      position: 'bottom',
    },
    tooltips: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: true,
    },
    animation: {
      duration: 0,
    },
    scales: {
      xAxes: [
        {
          display: true,
          type: 'linear',
          scaleLabel: {
            display: true,
            labelString: 'Время, с',
          },
          ticks: {
            beginAtZero: true,
            // suggestedMax: $task.tn.value * 2
          },
        },
      ],
      yAxes: [
        {
          display: true,
          ticks: {
            maxTicksLimit: 8,
            beginAtZero: true,
            // suggestedMax: $task.i.value
          },
          scaleLabel: {
            display: true,
            labelString: 'I, А',
          },
        },
      ],
    },
  },
}

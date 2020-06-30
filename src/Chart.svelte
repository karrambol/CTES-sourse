<script>
  import Chart from 'chart.js'
  import { results, result, plottedResult } from './stores.js'
  import { dataConfig, currentConfig } from './chartConfigs.js'
  import { onMount } from 'svelte'

  let currentCanvas
  let dataCanvas
  let dataChart = {}
  let currentChart = {}
  let current = 0

  let timeoutIDs = []
  $: current = $results.length - 1
  $: $plottedResult = current
  let request

  onMount(() => {
    Chart.defaults.global.elements.point.hoverRadius = 10
    let ctx = dataCanvas.getContext('2d')
    dataChart = new Chart(ctx, dataConfig)
    let ctx2 = currentCanvas.getContext('2d')
    currentChart = new Chart(ctx2, currentConfig)
  })

  $: {
    if ($results[0]) {
      dataChart.data.datasets[0].data = $result.T
      dataChart.data.datasets[1].data = $result.E
      currentChart.data.datasets[0].data = $result.I1
      currentChart.data.datasets[1].data = $result.I2
      request = requestAnimationFrame(() => {
        dataChart.update()
        currentChart.update()
      })
    }
  }
</script>

<style>
  .charts-wrapper {
    flex: 1;
    width: calc(100% - 350px);
  }
  .dataChart-wrapper {
    height: 80%;
  }
  .currentChart-wrapper {
    height: 20%;
  }
</style>

<div class="charts-wrapper">
  <div class="dataChart-wrapper">
    <canvas id="dataChart" bind:this={dataCanvas} />
  </div>
  <div class="currentChart-wrapper">
    <canvas id="currentChart" bind:this={currentCanvas} />
  </div>
</div>

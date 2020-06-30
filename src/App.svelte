<script>
  import { task, resistance, results, plottedResult } from './stores.js'
  import Solver from './Solver.svelte'
  import Chart from './Chart.svelte'
  import ResultSelector from './ResultSelector.svelte'
  import ThermalDataField from './ThermalDataField.svelte'
  import CircuitDataField from './CircuitDataField.svelte'
  import LoadDataField from './LoadDataField.svelte'
  import SolverDataField from './SolverDataField.svelte'
</script>
<style>
  .container {
    display: flex;
    height: 100%;
    flex-direction: row;
    padding-right: 20px;
  }
  h2 {
    color: #333;
    margin-bottom: 15px;
    margin-left: -10px;
    margin-right: -10px;
    padding: 5px;
    padding-left: 10px;
    border-bottom: 2px solid #333;
  }
  .params-wrapper {
    background-color: #118073;
    padding: 10px;
    padding-bottom: 0;
    min-width: 350px;
    width: 350px;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
  table {
    margin: 20px auto 20px auto;
    border: 2px solid #555;
    border-collapse: collapse;
  }
  .table-holder {
    border-top: 2px solid #118073;
  }
  th {
    background-color: #118073;
    border: 1px solid #333;
  }
  td {
    border: 1px solid #333;
  }
  table tr:nth-child(odd) {
    background-color: #ccc;
  }
  table tr:nth-child(even) {
    background-color: #118073;
  }
  .current-head-top {
    background-color: #0c554c;
    color: rgb(9, 173, 173);
  }
  .current-head {
    background-color: #0c554c;
    color: rgb(9, 173, 173);
  }
</style>

<div class="container">
  <div class="params-wrapper">
    <h2>Исходные данные</h2>
    <ThermalDataField />
    <CircuitDataField />
    <LoadDataField />
    <SolverDataField />
    <Solver />
    <ResultSelector />
  </div>
  <Chart />
</div>
{#if $results[0] && $results[0].result.length > 0}
  <div class="table-holder">
    <table>
      <tr>
        <th />
        {#each $results as { task }, id}
          <th class:current-head-top={id === $plottedResult} colspan="2">
            {id + 1}) {task.Rc.value}, {task.Rc.units}, {task.Vwind.value}, {task.Vwind.units}
          </th>
        {/each}
      </tr>
      <tr>
        <th>t, с</th>
        {#each $results as result, id}
          <th class:current-head={id === $plottedResult}>T{id + 1}, °С</th>
          <th class:current-head={id === $plottedResult}>E{id + 1}, Вт</th>
        {/each}
      </tr>
      {#each $results[0].result as point, i}
        <tr>
          <td>{point[0]}</td>
          {#each $results as { result }, i2}
            {#if result && result[i]}
              <td>{result[i][1]}</td>
              <td>{result[i][2]}</td>
            {:else}
              <td>-</td>
              <td>-</td>
            {/if}
          {/each}
        </tr>
      {/each}
    </table>
  </div>
{/if}

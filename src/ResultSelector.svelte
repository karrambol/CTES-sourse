<script>
  import { results, plotedResult, selectedResults } from './stores.js'

  let current = 0

  function itemDecompose(item) {
    return `${item.name}=${item.value} ${item.units}`
  }
  function taskDecompose(t) {
    return [
      itemDecompose(t.Rc),
      itemDecompose(t.Vwind),
      itemDecompose(t.tn),
      itemDecompose(t.Tair),
    ].join(', ')
  }
</script>

<style>
  p {
    margin: 0 0 0.3em 0;
  }
  select {
    width: 100%;
    border-radius: 5px;
    flex-shrink: 0;
  }
</style>

<p>Выбрать график результата:</p>
<select bind:value={$plotedResult}>
  {#each $results as { task }, i}
    <option value={i}>{i + 1}. {taskDecompose(task)}</option>
  {:else}
    <option disabled selected>нет результатов</option>
  {/each}
</select>


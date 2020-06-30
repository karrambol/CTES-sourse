<script>
  import { solver } from './stores.js'

  let expanded = false
  function toggleExpanded() {
    expanded = !expanded
  }

  const multiNumberRegExp = '(([0-9]*[.]?[0-9]+)[ ]?[,]?[ ]?)+'
  const singleNumberRegExp = '[0-9]*[.]?[0-9]+'
  let { values, units, description } = $solver
  $: if (values[values.length - 1].t || values[values.length - 1].step) {
    values.push({ id: values.length, t: '', step: '' })
  }
</script>

<style>
  input {
    border-radius: 5px;
  }
  .table-input {
    margin: 0;
    border: 0;
    border-radius: 0;
    width: 100%;
  }
  input:invalid {
    outline: #a31818 solid 3px;
  }
  p {
    margin: 0 0 0.3em 0;
    margin-left: 0;
  }
  .pad {
    color: #eee;
    width: auto;
    height: 25px;
    padding-left: 10px;
    padding-right: 10px;
    margin-left: 0;
    margin-right: 0;
    border-radius: 5px;
    background-color: rgb(8, 80, 71);
    display: flex;
    justify-content: space-between;
  }
  .pad p {
    margin: 0;
  }
  .pad-expanded {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .pad:hover {
    cursor: pointer;
  }
  .DataField-container {
    padding: 10px 0px;
  }

  .params-container {
    /* margin-top: 10px; */
    padding: 10px;
    border: 2px solid #085047;
    border-top: none;
    border-radius: 5px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
  table {
    margin: auto;
    margin-left: 0;
    border-collapse: collapse;
    border: 1px solid #085047;
    width: 100%;
  }
  th {
    background-color: #ccc;
    border: 2px solid #000;
    padding: 0;
    font-weight: normal;
  }
  td {
    padding: 0;
    border: 2px outset #555;
  }
  th span {
    font-style: italic;
    font-weight: bold;
  }
  .numder-col {
    width: 20px;
    padding: 5px;
    text-align: center;
    background-color: #ccc;
  }
</style>

<div class="DataField-container">
  <div class="pad" class:pad-expanded={expanded} on:click={toggleExpanded}>
    <p>{expanded ? '▼' : '⏵'} Настройки решателя</p>
    <span>{expanded ? 'свернуть' : 'развернуть...'}</span>
  </div>
  {#if expanded}
    <div class="params-container">
      <p>{description}:</p>
      <table>
        <tr>
          <th />
          <th>
            <span>t</span>
            , {units[0]}
          </th>
          <th>
            <span>шаг</span>
            , {units[1]}
          </th>
        </tr>
        {#each values as { id, t, step }, id}
          <tr>
            <td class="numder-col">{id + 1}</td>
            <td>
              <input
                class="table-input"
                type="text"
                pattern={singleNumberRegExp}
                bind:value={t} />
            </td>
            <td>
              <input
                class="table-input"
                type="text"
                pattern={singleNumberRegExp}
                bind:value={step} />
            </td>
          </tr>
        {/each}
      </table>
    </div>
  {/if}
</div>

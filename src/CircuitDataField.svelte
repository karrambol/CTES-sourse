<script>
  import { resistance } from './stores.js'

  let expanded = false
  function toggleExpanded() {
    expanded = !expanded
  }
  const multiNumberRegExp = '(([0-9]*[.]?[0-9]+)[ ]?[,]?[ ]?)+'
  const singleNumberRegExp = '[0-9]*[.]?[0-9]+'
</script>

<style>
  input {
    width: 220px;
    border-radius: 5px;
  }
  input:invalid {
    outline: #a31818 solid 3px;
  }
  p {
    margin: 0 0 0.3em 0;
    margin-left: 0;
  }
  .pad {
    color: rgb(9, 173, 173);
    width: auto;
    height: 25px;
    /* margin: 10px; */
    padding-left: 10px;
    padding-right: 10px;
    margin-left: 0;
    margin-right: 0;
    border-radius: 5px;
    background-color: #085047;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    display: flex;
    justify-content: space-between;
  }
  .pad p {
    margin: 0;
  }
  .pad:hover {
    cursor: pointer;
  }
  .name-holder {
    display: inline-block;
    text-align: center;
    font-style: italic;
    font-weight: bold;
    margin-right: 5px;
    width: 30px;
    text-align: right;
  }
  .CirquitDataField-container {
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
</style>

<div class="CirquitDataField-container">
  <div class="pad" class:pad-expanded={expanded} on:click={toggleExpanded}>
    <p>{expanded ? '▼' : '⏵'} Параметры схемы</p>
    <span>{expanded ? 'свернуть' : 'развернуть...'}</span>
  </div>
  <div class="params-container">
    {#each Object.values($resistance).filter(el => el.name === 'Rc' || expanded) as { name, value, units, description }}
      {#if name === 'Rc'}
        <div class="param">
          <p>{description}:</p>
          <div class="name-holder">{name}</div>
          <input type="text" pattern={multiNumberRegExp} bind:value />
          {units}
        </div>
      {:else}
        <div class="param">
          <p>{description}:</p>
          <div class="name-holder">{name}</div>
          <input type="text" pattern={singleNumberRegExp} bind:value />
          {units}
        </div>
      {/if}
    {/each}
  </div>
</div>

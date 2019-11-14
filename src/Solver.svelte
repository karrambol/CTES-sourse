<script>
  import { task, resistance, thermal, results, loads } from './stores.js'
  import { Solver } from './odex'
  import { convectionObj } from './hConv'
  import createCircuit, { NMSearchVH } from './createCircuit'
  import initClampDE from './createDE'
  import { onMount } from 'svelte'

  let progresses = []
  let inProgress = 0

  let current = 0

  function solveWorker(cur, R) {
    if (window.Worker) {
      const myWorker = new Worker('worker.js')
      $results[cur] = {
        task: {
          ...$task,
          Rc: R,
        },
        result: [],
      }
      let rez = []
      let timeLast = new Date()
      let isDone = false
      progresses.push({
        id: cur,
        progress: 0,
        max: $results[cur].task.tn.value + $results[cur].task.tn2.value,
      })
      myWorker.onmessage = function fromWW(e) {
        if (!e.data.isDone && !isDone) {
          rez.push(e.data.result)
          let timeNow = new Date()
          if (timeNow - timeLast >= 1000 / 30) {
            $results[cur].result = [...$results[cur].result, ...rez];
            [progresses[cur].progress] = rez[rez.length - 1]
            rez = []
            timeLast = new Date()

          }
        } else {
          $results[cur] = e.data.results
          progresses[cur].progress = progresses[cur].max
          isDone = true
          myWorker.terminate()
          inProgress -= 1
        }
      }
      inProgress += 1

      myWorker.postMessage({
        thermal: $thermal,
        resistance: { ...$resistance, Rc: R },
        task: { ...$task, Rc: R },
        loads: $loads.loads,
      })
    } else {
      console.log("Your browser doesn't support web workers.")
    }
  }
  function handleClick() {
    const inpStr = $resistance.Rc.value
    let arrR = inpStr.split(',').map(el => parseFloat(el))
    arrR.forEach(function runWW(el, i) {
      solveWorker(i + current, {
        ...$resistance.Rc,
        value: el,
      })
    })
    current += arrR.length
  }
  onMount(() => {
    function optimize() {
      const start = new Date()
      const rez = NMSearchVH(
        $resistance,
        (itr, x, objF, centr, action, objEvals) => {
          console.log(
            `${itr}. [${x[0]},${x[1]}] err = ${(objF * 100).toFixed(4)} % n = ${
              $task.n.value
            }, ${objEvals} evals, ${action}`
          )
        }
      )
      const end = new Date()
      console.log(rez, `${end - start}, sec`)
    }
    // solveDE()

    // setTimeout(() => {optimize()},500);
  })
</script>

<style>
  button {
    align-self: flex-end;
    margin: auto 20px auto auto;
    float: right;
    border-radius: 5px;
  }
  .solver-container {
    padding: 10px 0px;
  }
  .button-container {
    width: 100%;
    display: flex;
  }
  .progresses-container {
    margin-top: 10px;
    padding: 10px;
    border: 2px solid #085047;
    border-radius: 5px;
  }
</style>

<div class="solver-container">
  <div class="button-container">
    <button on:click={handleClick}>Рассчитать</button>
  </div>
  <div class:progresses-container={inProgress}>
    {#if inProgress}Запущенные решатели ({inProgress}):{/if}
    {#each progresses as { max, progress, id }, id}
      {#if progress < max}
        <div>
          {id + 1}.
          <progress {max} value={progress}>
            <span id="value">{progress}/{max}</span>
          </progress>
        </div>
      {/if}
    {/each}
  </div>
</div>

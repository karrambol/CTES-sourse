<script>
	export let params = [
		{name:'Vwind', value: 1, units: 'м/с'},
		{name:'Rcont', value: 16, units: 'мкОм'},
		{name:'Tair', value: 20, units: '&#176;С'},
		{name:'i', value: 200, units: 'А'}
	]
</script>

<style>
	.container {
		display: flex;
		height: 100%;
		flex-direction: column;
	}
	h2 {
		color: #555;
		margin: 5px;
	}
	p {
		margin: 0 0 0.5em 0;
		margin-left: 0;
	}
	.params-wrapper {
		padding-bottom: 5px;
		margin-bottom: 5px;
		border-bottom: 2px solid #555;
	}
	.param {
		margin-right: 50px;
		display:inline-block
	}
	.charts-wrapper {
		flex: 1;
	}
	.dataChart-wrapper {
		height:80%;
	}
	.currentChart-wrapper {
		height:20%;
	}
</style>

<div class="container">
	<div class="params-wrapper">
		<h2>Исходные данные</h2>
		{#each params as param}
			<div class="param"> <p>{param.name}:</p> <input type="text" bind:value={param.value}> {@html param.units}</div>
		{/each}
		<button >Рассчитать</button>
	</div>
	<div class="charts-wrapper">
		<div class="dataChart-wrapper">
			<canvas id="dataChart" class="inherit-h"></canvas>
		</div>
		<div class="currentChart-wrapper">
			<canvas id="currentChart" class="inherit-h"></canvas>
		</div>
	</div>
</div>

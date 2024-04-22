<script lang="ts">
	import { type Writable, writable } from 'svelte/store';

	let dataSuccess = writable('No data');
	let testErrorError = writable('No data');
	let dataParamSuccess = writable('No data');
	let dataParamError = writable('No data');
	let dataSuccessManual = writable('No data');
	let dataErrorManual = writable('No data');
	let dataLocalVariablesUncaught = writable('No data');
	let dataLocalVariablesCaught = writable('No data');

	const fetchData = async (url: string, store: Writable<any>) => {
		console.log('fetching', url);
		const res = await fetch(url);
		const data = await res.json();
		store.set(data);
	};

	const displayData = (data: any) => (data ? JSON.stringify(data, null, 2) : 'No data');
</script>

<main>
	<div>
		<h1>Layout (/)</h1>
		<button on:click={() => fetchData('/api/test-success', dataSuccess)}>Test Success</button>
		<p>{displayData($dataSuccess)}</p>

		<button on:click={() => fetchData('/api/test-error', testErrorError)}>Test Error</button>
		<p>{$testErrorError}</p>

		<button on:click={() => fetchData('/api/test-param-success/1337', dataParamSuccess)}
			>Test Param Success</button
		>
		<p>{$dataParamSuccess}</p>

		<button on:click={() => fetchData('api/test-param-error/1337', dataParamError)}
			>Test Param Error</button
		>
		<p>{$dataParamError}</p>

		<button on:click={() => fetchData('/api/test-success-manual', dataSuccessManual)}
			>Test Success Manual</button
		>
		<p>{$dataSuccessManual}</p>

		<button on:click={() => fetchData('/api/test-error-manual', dataErrorManual)}
			>Test Error Manual</button
		>
		<p>{$dataErrorManual}</p>

		<button
			on:click={() => fetchData('/api/test-local-variables-uncaught', dataLocalVariablesUncaught)}
			>Test Local Variables Uncaught</button
		>
		<p>{$dataLocalVariablesUncaught}</p>

		<button on:click={() => fetchData('/api/test-local-variables-caught', dataLocalVariablesCaught)}
			>Test Local Variables Caught</button
		>
		<p>{$dataLocalVariablesCaught}</p>
	</div>
</main>

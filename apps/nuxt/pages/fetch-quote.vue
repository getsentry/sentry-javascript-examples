<script setup>
import Quote from '~/components/Quote.vue';
import ErrorButton from '~/components/ErrorButton.vue';

const id = ref(1)
</script>

<template>
  <p>{{ $route.params.param }} - {{ $route.params.param }}</p>
  <ErrorButton />

  <div>
    <p>Example of data fetching inside a component:</p>
    <p><button @click="id--">Previous</button> - <button @click="id++">Next</button></p>
    <Quote :id="id" />
  </div>
</template>
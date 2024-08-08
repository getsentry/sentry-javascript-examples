<script setup>
const props = defineProps({
  id: Number
})
const { data: quote, status, error } = await useFetch(() => `https://dummyjson.com/quotes/${props.id}`)
</script>

<template>
  <div>
    <p v-if="status === 'pending'">Fetching...</p>
    <pre v-else-if="error">Could not load quote: {{ error.data }}</pre>
    <figure v-else class="quote">
      <blockquote>{{ quote.quote }}</blockquote>
      <figcaption>&mdash; {{ quote.author }}</figcaption>
    </figure>
  </div>
</template>

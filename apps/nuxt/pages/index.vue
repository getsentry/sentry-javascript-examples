<template>
  <div><button @click="triggerError">Trigger Error</button><br /></div>
</template>

<script>
export default {
  methods: {
    triggerError() {
      throw new Error('This is a test error for Sentry');
    },
  },
};
</script>

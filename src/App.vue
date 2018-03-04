<template>
  <div id="app">
    <div>
      <canvas-component></canvas-component>
    </div>
  </div>
</template>

<script>
import Canvas from './components/Canvas.vue'

export default {
  components: {
    'canvas-component': Canvas
  }
}
</script>

<style>
#app {
  font-family: Helvetica, sans-serif;
  text-align: center;
}
</style>

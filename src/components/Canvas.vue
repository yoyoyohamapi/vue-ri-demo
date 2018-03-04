<template>
<div>
  <div class="block">
    <span class="demonstration">颜色</span>
    <el-color-picker v-model="color"></el-color-picker>
  </div>
  <canvas ref="icanvas" width="400" height="400"></canvas>
  <script id="vertex-shader" type="notjs">
    attribute vec4 a_position;
    void main() {
      gl_Position = a_position;
    }
  </script>
  <script id="fragment-shader" type="notjs">
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
  </script>
</div>
</template>

<script>
import * as webglUtils from '../libs/webgl-utils'
import Rx from 'rxjs/Rx'
import Color from 'color'

export default {
  data() {
    return {
      gl: null,
      color: '#FFFFFF',
      colorLocation: null
    }
  },
  subscriptions() {
    return {
      rgb: this.$watchAsObservable('color')
        .pluck('newValue')
        .map(color => Color(color).rgb().array()) // 十六进制转换为 rgb
        .map(rgb => rgb.map(color => color/255))
    }
  },
  methods: {
    draw(options) {
      const { color } = options
      const gl = this.gl
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform4fv(this.colorLocation, color)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
  },
  mounted: function() {
    const canvas = this.$refs.icanvas
    const gl = canvas.getContext('webgl')
    this.gl = gl
    const program = webglUtils.createProgramFromScripts(gl, '#vertex-shader', '#fragment-shader')
    gl.useProgram(program)

    // 获得属性位置
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    // 获得全局变量位置
    const colorLocation = gl.getUniformLocation(program, 'u_color')
    this.colorLocation = colorLocation

    const triangle = new Float32Array([
      -0.5, -0.5,
      0, 0.5,
      0.5, -0.5
    ])

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, triangle, gl.STATIC_DRAW)

    gl.clearColor(0, 0, 0, 1)

    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(positionLocation)

    this.$subscribeTo(this.$observables.rgb, color => this.draw({color}))
  }
}
</script>
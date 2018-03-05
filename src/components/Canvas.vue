<template>
<div>

<el-container>
  <el-header>
    <el-row>
      <el-col :span="6" :offset="6">
         <el-color-picker v-model="color" size="small"></el-color-picker>
      </el-col>
      <el-col :span="6">
        <el-tag>平均数：{{average$}}</el-tag>
      </el-col>
    </el-row>
  </el-header>
  <el-main>
    <canvas 
      ref="icanvas" 
      width="400" 
      height="400" 
      v-stream:mousedown="canvasMouseDown$"
      v-stream:mouseup="canvasMouseUp$"
      v-stream:mousemove="canvasMouseMove$" 
    >
    </canvas>
  </el-main>
</el-container>
  <script id="vertex-shader" type="notjs">
    attribute vec4 a_position;
    uniform mat4 u_matrix;
    void main() {
      gl_Position = u_matrix * a_position;
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
import {Matrix4} from '../libs/cuon-matrix'
import Rx from 'rxjs/Rx'
import Color from 'color'
import axios from 'axios'

import Worker from 'worker-loader!../workers/average'
const worker = new Worker

export default {
  data() {
    return {
      gl: null,
      color: '#FFFFFF',
      colorLocation: null,
      matrixLocation: null,
      matrix: null
    }
  },
  domStreams: ['canvasMouseDown$', 'canvasMouseMove$', 'canvasMouseUp$'],
  subscriptions() {
    const documentMouseUp$ = Rx.Observable.fromEvent(document, 'mouseup')
    const documentKeyDown$ = Rx.Observable.fromEvent(document, 'keydown')
    const mouseUp$ = Rx.Observable.merge(documentMouseUp$, this.canvasMouseUp$)
    
    // 鼠标按下,或者按住 r 开始旋转
    // 鼠标移动时进行旋转，每次移动旋转 1°
    // 鼠标抬起时候结束旋转
    const mouseRotate$ = this.canvasMouseDown$.flatMapTo(
      this.canvasMouseMove$.takeUntil(mouseUp$)
    )
    const keyboardRotate$ = documentKeyDown$.filter(event => event.key === 'r')
    const rotate$ = Rx.Observable
      .merge(
        mouseRotate$,
        keyboardRotate$
      )
      .mapTo(1)
      
    const rgba$ = this.$watchAsObservable('color')
        .pluck('newValue')
        .map(color => Color(color).rgb().array()) // 十六进制转换为 rgb
        .map(rgb => rgb.map(color => color/255).concat([1.0]))
        .startWith([1, 1, 1, 1])
    const angle$ = rotate$.startWith(0)

    // 角度变幻时请求数据
    const data$ = angle$
      .debounceTime(500)
      .switchMap(() => Rx.Observable.fromPromise(axios.get('/api/')))
      .pluck('data')

    // 绘制选项流
    const drawOptions$ = Rx.Observable
      .combineLatest(rgba$, angle$)
      .map(([rgba, angle]) => ({rgba, angle}))
    
    // 计算流
    const average$ = Rx.Observable.fromEvent(worker, 'message')
      .pluck('data')

    return {
      drawOptions$,
      data$,
      average$
    } 
  },
  methods: {
    draw(options) {
      const { rgba, angle } = options
      const gl = this.gl
      this.matrix.rotate(-angle, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform4fv(this.colorLocation, rgba)
      gl.uniformMatrix4fv(this.matrixLocation, false, this.matrix.elements)
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
    const matrixLocation = gl.getUniformLocation(program, 'u_matrix')
    this.colorLocation = colorLocation
    this.matrixLocation = matrixLocation
    this.matrix = new Matrix4()
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
 
    this.$observables.drawOptions$.subscribe(this.draw)
    this.$observables.data$.subscribe(data => worker.postMessage(data))
  }
}
</script>
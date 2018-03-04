import Vue from 'vue'
import VueRx from 'vue-rx'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import { Observable } from 'rxjs/Observable'
import { Subscription } from 'rxjs/Subscription' // Disposable if using RxJS4
import { Subject } from 'rxjs/Subject' // required for domStreams option

Vue.use(ElementUI)

Vue.use(VueRx, {
  Observable,
  Subscription,
  Subject
})

const vm = new Vue({
  el: '#app',
  render: h => h(App)
})

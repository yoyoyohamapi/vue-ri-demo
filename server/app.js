const Koa = require('koa')
const Router = require('koa-better-router')
const router = Router().loadMethods()
const app = new Koa()
const _ = require('lodash/fp')

router.get('/api', (ctx, next) => {
  ctx.body = _.range(1, 10000).map(() => _.random(0, 1000))
  return next()
})

app.use(router.middleware())
app.listen(3000)


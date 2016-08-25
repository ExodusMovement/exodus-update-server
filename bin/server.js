const express = require('express')
const minimist = require('minimist')
const path = require('path')
const UpdateServer = require('../lib')

const argv = minimist(process.argv.slice(2), {
  string: [
    'datadir',
    'path',
    'port'
  ],
  default: {
    datadir: path.join(__dirname, '..', 'data'),
    path: '/desktop',
    port: 8000
  }
})

const app = express()
app.use(argv.path, new UpdateServer({ datadir: argv.datadir }).router)

// 404 and 500
app.use((req, res) => res.status(404).send('Page not found.'))
app.use((err, req, res, next) => {
  const msg = err.message || err
  res.format({
    plain: () => res.status(500).send(msg),
    html: () => res.status(500).send(msg),
    json: () => res.status(500).send({ code: 500, error: msg })
  })
})

const server = app.listen(argv.port, (err) => {
  if (!err) return console.log(`Listening at ${server.address().address}:${server.address().port}`)

  console.error(err.stack || err)
  process.exit(1)
})

const { connect, format } = require('../lib/index.js')
const assert = require('assert')

const { request, destroy } = connect('http://localhost:4440')

const ping = async () => {
  const res = await request(format('ping'))

  assert.deepEqual(res, { data: 'pong', error: null })
  console.log('pong')
  destroy()
}

ping().catch((err) => console.log(err))

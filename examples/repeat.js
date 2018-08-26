const { connect } = require('../lib/index.js')
const assert = require('assert')
const Promise = require('promise')

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const { request, destroy } = connect('http://localhost:4440')

const ping = async () => {
  const req = {
    call: 'ping',
    data: null
  }

  while(true) {
    await request(req)
    await sleep(1000)
  }

  destroy()
}

ping().catch((err) => console.log(err))

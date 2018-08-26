const decode = input => {
  try {
    return JSON.parse(input)
  } catch (e) {
    throw new Error('Expected JSON')
  }
}

const encode = (message) => JSON.stringify(message)

module.exports = {
  encode,
  decode
}

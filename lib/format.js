
const format = (endpoint, data = null) => {
  return {
    'call': endpoint,
    'data': data
  }
}

module.exports = format

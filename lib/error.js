class ResponseError extends Error {
  constructor (data, error) {
    super('Response error')
    this.data = data
    this.error = error
  }
}

module.exports = {
  ResponseError
}

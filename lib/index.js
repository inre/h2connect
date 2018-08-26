const error = require('debug')('h2connect:error')
const log = require('debug')('h2connect:log')
const http2 = require('http2')
const { parse } = require('url')
const $$observable = require('symbol-observable')
const { encode, decode } = require('./de')
const format = require('./format')
const { ResponseError } = require('./error')
const { Observable, Subject } = require('rxjs/Rx')

const {
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_AUTHORITY
} = http2.constants

const connect = (authority, options = {}) => {
  const url = parse(authority.toString())
  const requestOptions = {
    [HTTP2_HEADER_PATH]: '/',
    // [HTTP2_HEADER_METHOD]: 'post',
    [HTTP2_HEADER_AUTHORITY]: url.host
  }
  const clientOptions = {
    maxReservedRemoteStreams: 10,
    ...options
  }

  const subject = new Subject()
  let client

  const clientConnect = () => {
    client = http2.connect(authority, clientOptions)

    client.on('connect', () => {
      log(`${authority} connected`)
    })

    client.on('error', (err) => {
      error(err)
    })

    client.on('socketError', (err) => {
      error(err)
    })

    client.on('frameError', (err) => {
      error(err)
    })

    client.on('stream', (pushedStream, requestHeaders) => {
      let output = ''

      pushedStream.on('push', (responseHeaders) => {
        // process response headers
      })

      pushedStream.on('data', (chunk) => {
        output += chunk
      })

      pushedStream.on('end', () => {
        let om
        try {
          om = decode(output)
        } catch (err) {
          // FIXME: show error
          return
        }
        subject.next(om)
      })
    })
  }

  const getPush = () => {
    return Observable.create((observer) => {
      subject.subscribe((data) => observer.next(data))
    })
  }

  const clientRequest = (message) =>
    new Promise((resolve, reject) => {
      const stream = client.request(requestOptions, { 'endStream': false })
      const encodedMessage = encode(message)

      stream.setEncoding('utf8')
      stream.end(encodedMessage)
      stream.on('streamClosed', () => {
        log(`${authority} stream closed`)
      })

      stream.on('error', (err) => {
        reject(err)
      })

      stream.on('response', (headers, flags) => {
        let output = ''

        stream.on('data', (chunk) => {
          output += chunk
        })

        stream.on('end', () => {
          let object
          try {
            object = decode(output)
          } catch (err) {
            reject(err)
            return
          }
          if (typeof object !== 'object') {
            throw new Error('Expected object')
          }
          const { data, error } = object

          if (error !== null) {
            reject(new ResponseError(data, error))
          }

          resolve(data)
        })
      })
    })

  const isConnected = () => !client.destroyed
  const destroy = () => client.destroy()

  const request = async (call, data) => {
    // try to reconnect on every request
    if (!isConnected()) {
      clientConnect()
    }

    const result = await clientRequest(format(call, data))
    return result
  }

  // Initial connection
  clientConnect()

  return {
    request,
    isConnected,
    getPush,
    destroy,
    [$$observable]: getPush
  }
}

module.exports = {
  connect,
  format
}

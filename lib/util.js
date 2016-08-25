const urlJoin = require('url-join')
const urlNormalize = require('normalize-url')

function downloadUrl (req, pathback, filename) {
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  const url = /^(.*?)(\?.*)?(#.*)?$/.exec(fullUrl)[1]
  return urlNormalize(urlJoin(url, pathback, `/download/${filename}`))
}

module.exports = {
  downloadUrl
}

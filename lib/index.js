const express = require('express')
const expressUserAgent = require('express-useragent')
const semver = require('semver')
const controllers = require('./controllers')
const Announcements = require('./announcements')
const Releases = require('./releases')

class UpdateServer {
  constructor (options) {
    this._initRouter()
    this.announcements = new Announcements(options.datadir)
    this.releases = new Releases(options.datadir)
  }

  _initRouter () {
    this.router = express.Router()
    this.router.use(expressUserAgent.express())

    // announcement controller
    this.router.get('/announcement/:platform/:arch/:version', controllers.onAnnouncement(this))

    // update controllers
    this.router.get('/update/:platform/:arch/:version', controllers.onUpdate(this))
    this.router.get('/update/:platform/:arch/:version/RELEASES', controllers.onUpdateWin(this))

    // download constrollers
    this.router.get('/download/:filename', controllers.onDownload(this))
    this.router.get('/download/:platform/:arch/:version', controllers.onDownload(this))

    // validators
    this.router.param('platform', (req, res, next, platform) => {
      const isValid = [ 'darwin', 'linux', 'win32' ].includes(platform)
      next(isValid ? null : new Error(`Invalid platform: ${platform}`))
    })

    this.router.param('arch', (req, res, next, arch) => {
      const isValid = [ 'ia32', 'x64' ].includes(arch)
      next(isValid ? null : new Error(`Invalid arch: ${arch}`))
    })

    this.router.param('version', (req, res, next, version) => {
      let isValid = semver.valid(version)

      const re = new RegExp(`(.*)/download/(darwin|linux|win32)/(ia32|x64)/${version}$`)
      if (!isValid && re.test(req.path)) isValid = version === 'latest'

      next(isValid ? null : new Error(`Invalid version: ${version}`))
    })
  }
}

module.exports = UpdateServer

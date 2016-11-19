'use strict'
const express = require('express')
const semver = require('semver')
const Announcements = require('./announcements')
const Releases = require('./releases')
const Controllers = require('./controllers')

module.exports = (options) => {
  const announcements = Announcements(options.datadir)
  const releases = Releases(options.datadir)
  const controllers = Controllers(announcements, releases)
  const router = express.Router()

  // announcement controller
  router.get('/announcement/:platform/:arch/:version', controllers.onAnnouncement)

  // update controllers
  router.get('/update/:platform/:arch/:version', controllers.onUpdate)
  router.get('/update/:platform/:arch/:version/RELEASES', controllers.onUpdateWin)

  // download constrollers
  router.get('/download/:filename', controllers.onDownload)
  router.get('/download/:platform/:arch/:version', controllers.onDownload)

  // validators
  router.param('platform', (req, res, next, platform) => {
    const isValid = [ 'darwin', 'linux', 'win32' ].includes(platform)
    next(isValid ? null : new Error(`Invalid platform: ${platform}`))
  })

  router.param('arch', (req, res, next, arch) => {
    const isValid = [ 'ia32', 'x64' ].includes(arch)
    next(isValid ? null : new Error(`Invalid arch: ${arch}`))
  })

  router.param('version', (req, res, next, version) => {
    const isValid = version === 'latest' || semver.valid(version) === version
    next(isValid ? null : new Error(`Invalid version: ${version}`))
  })

  return router
}

'use strict'
const fs = require('fs')
const path = require('path')
const semver = require('semver')
const lodash = require('lodash')
const debug = require('debug')('exodus-update-server:announcements')

module.exports = (dir) => {
  const filepath = path.join(dir, 'announcements.json')

  let data = null
  function load () {
    fs.readFile(filepath, (err, content) => {
      if (err) return console.error(err.stack || err)

      try {
        data = JSON.parse(content)
        debug('loaded')
      } catch (err) {
        console.error(err.stack || err)
      }
    })
  }

  fs.watchFile(filepath, load)
  load()

  return {
    get (platform, arch, version) {
      for (let range of Object.keys(data)) {
        const isValid = semver.satisfies(version, range)
        if (isValid) return lodash.get(data, [range, platform, arch], null)
      }

      return null
    }
  }
}

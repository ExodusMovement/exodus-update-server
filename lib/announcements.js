const fs = require('fs')
const path = require('path')
const semver = require('semver')
const lodash = require('lodash')
const debug = require('debug')('exodus-update-server')

class Announcements {
  constructor (dir) {
    const content = fs.readFileSync(path.join(dir, 'announcements.json'))
    this._data = JSON.parse(content)
    debug('announcements: loaded')
  }

  get (platform, arch, version) {
    for (let range of Object.keys(this._data)) {
      if (semver.satisfies(version, range)) {
        return lodash.get(this._data, [ range, platform, arch ], null)
      }
    }

    return null
  }
}

module.exports = Announcements

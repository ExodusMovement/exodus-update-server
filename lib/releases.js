const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const lodash = require('lodash')
const semver = require('semver')
const _ = require('lodash')
const debug = require('debug')('exodus-update-server')

const TYPE_PRIORITY = {
  dmg: 1,
  exe: 1,
  zip: 2
}

class Releases {
  constructor (dir) {
    this._data = []

    dir = path.join(dir, 'releases')
    for (const filename of fs.readdirSync(dir)) {
      for (const fn of [ checkDmg, checkExe, checkNupkg, checkZip ]) {
        const result = fn(filename)
        if (result) {
          const props = { path: path.join(dir, filename) }
          if (result.type.startsWith('nupkg')) {
            props.size = fs.statSync(props.path).size
            const content = fs.readFileSync(props.path)
            props.hash = crypto.createHash('sha1').update(content).digest('hex').toUpperCase()
          }

          this._data.push(Object.assign(result, props))
          debug(`releases: loaded ${filename}`)
          break
        }
      }
    }
  }

  get (platform, arch, range) {
    let data = this._data.filter((obj) => {
      return obj.platform === platform &&
             obj.arch === arch &&
             !obj.type.startsWith('nupkg')
    })

    if (range === 'latest') {
      let latestVersion = '0.0.0'
      data = data.reduce((result, obj) => {
        if (semver.eq(obj.version, latestVersion)) {
          result.push(obj)
        } else if (semver.gt(obj.version, latestVersion)) {
          result = [ obj ]
          latestVersion = obj.version
        }

        return result
      }, [])
    } else {
      let maxVersion = semver.maxSatisfying(_.map(data, 'version'), range)
      data = _.filter(data, { version: maxVersion })
    }

    data = _.sortBy(data, (obj) => TYPE_PRIORITY[obj.type])
    return data[0] || null
  }

  getRELEASES (platform, arch, range) {
    return this._data.filter((obj) => {
      return obj.platform === platform &&
             obj.arch === arch &&
             obj.type.startsWith('nupkg') &&
             semver.satisfies(obj.version, range)
    })
    .sort((o1, o2) => {
      if (semver.eq(o1.version, o2.version)) {
        return o1.type === 'nupkg-delta' ? -1 : 1
      }

      return semver.lt(o1.version, o2.version) ? -1 : 1
    })
  }

  getByFilename (filename) {
    return lodash.find(this._data, { filename }) || null
  }
}

function checkDmg (filename) {
  const result = /^(.*)-(\d+\.\d+\.\d+)-darwin-x64\.dmg$/.exec(filename)
  return result === null ? null : {
    filename,
    version: result[2],
    platform: 'darwin',
    arch: 'x64',
    type: 'dmg'
  }
}

function checkExe (filename) {
  const result = /^(.*)-(\d+\.\d+\.\d+)-win32-(ia32|x64)\.exe$/.exec(filename)
  return result === null ? null : {
    filename,
    version: result[2],
    platform: 'win32',
    arch: result[3],
    type: 'exe'
  }
}

function checkNupkg (filename) {
  const result = /^(.*)-(\d+\.\d+\.\d+)-win32-(ia32|x64)-(full|delta)\.nupkg$/.exec(filename)
  return result === null ? null : {
    filename,
    version: result[2],
    platform: 'win32',
    arch: result[3],
    type: `nupkg-${result[4]}`
  }  
}

function checkZip (filename) {
  const result = /^(.*)-(\d+\.\d+\.\d+)-(darwin|linux|win32)-(ia32|x64)\.zip$/.exec(filename)
  return result === null ? null : {
    filename,
    version: result[2],
    platform: result[3],
    arch: result[4],
    type: 'zip'
  }
}

module.exports = Releases

'use strict'
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const semver = require('semver')
const lodash = require('lodash')
const debug = require('debug')('exodus-update-server:releases')

const TYPE_PRIORITY = {
  dmg: 1,
  exe: 1,
  tar: 1,
  zip: 2
}

function createTypeCheck (re, transform) {
  return (filename) => {
    const result = re.exec(filename)
    return result === null ? null : transform(result)
  }
}

const typeChecks = [
  // dmg [macosx]
  createTypeCheck(
    /^Exodus-(\d+\.\d+\.\d+)-darwin-x64\.dmg$/,
    (data) => ({ version: data[1], platform: 'darwin', arch: 'x64', type: 'dmg' })),

  // exe [windows]
  createTypeCheck(
    /^Exodus-(\d+\.\d+\.\d+)-win32-(ia32|x64)\.exe$/,
    (data) => ({ version: data[1], platform: 'win32', arch: data[2], type: 'exe' })),

  // nupkg [windows]
  createTypeCheck(
    /^Exodus-(\d+\.\d+\.\d+)-win32-(ia32|x64)-(full|delta)\.nupkg$/,
    (data) => ({ version: data[1], platform: 'win32', arch: data[2], type: `nupkg-${data[3]}` })),

  // tar [linux]
  createTypeCheck(
    /^Exodus-(\d+\.\d+\.\d+)-linux-(ia32|x64)\.tar$/,
    (data) => ({ version: data[1], platform: 'linux', arch: data[2], type: 'tar' })),

  // zip [macosx,linux,windows]
  createTypeCheck(
    /^Exodus-(\d+\.\d+\.\d+)-(darwin|linux|win32)-(ia32|x64)\.zip$/,
    (data) => ({ version: data[1], platform: data[2], arch: data[3], type: 'zip' }))
]

module.exports = (dir) => {
  const dirpath = path.join(dir, 'releases')

  let data = {}
  function load () {
    fs.readdir(dirpath, (err, filenames) => {
      if (err) return console.error(err.stack || err)

      // unload first
      for (let filename of Object.keys(data)) {
        const isStale = !filenames.includes(filename)
        if (isStale) {
          delete data[filename]
          debug(`unload ${filename}`)
        }
      }

      // load now
      for (let filename of filenames) {
        const obj = data[filename]
        if (!(obj === undefined || obj.type.startsWith('nupkg'))) continue

        for (let typeCheck of typeChecks) {
          const result = typeCheck(filename)
          if (result === null) continue

          const props = { filename, path: path.join(dirpath, filename) }
          if (result.type.startsWith('nupkg')) {
            const content = fs.readFileSync(props.path)
            props.size = content.length
            props.hash = crypto.createHash('sha1').update(content).digest('hex').toUpperCase()
          }

          data[filename] = Object.assign(result, props)
          if (obj === undefined) debug(`load ${filename}`)
          break
        }
      }
    })
  }

  setInterval(load, 5007)
  load()

  return {
    get (platform, arch, range) {
      let items = lodash.values(data)
        .filter((obj) => {
          return !obj.type.startsWith('nupkg') &&
                 obj.platform === platform &&
                 obj.arch === arch
        })

      if (range === 'latest') {
        let latestVersion = '0.0.0'
        items = items.reduce((result, obj) => {
          if (semver.gt(obj.version, latestVersion)) {
            result = [obj]
            latestVersion = obj.version
          } else if (semver.eq(obj.version, latestVersion)) {
            result.push(obj)
          }

          return result
        }, [])
      } else {
        const version = semver.maxSatisfying(lodash.map(items, 'version'), range)
        items = lodash.filter(items, { version })
      }

      items = lodash.sortBy(items, (obj) => TYPE_PRIORITY[obj.type])
      return items[0] || null
    },

    getRELEASES (platform, arch, range) {
      return lodash.values(data)
        .filter((obj) => {
          return obj.type.startsWith('nupkg') &&
                 obj.platform === platform &&
                 obj.arch === arch &&
                 semver.satisfies(obj.version, range)
        })
        .sort((o1, o2) => {
          if (semver.eq(o1.version, o2.version)) {
            return o1.type === 'nupkg-delta' ? -1 : 1
          }

          return semver.lt(o1.version, o2.version) ? -1 : 1
        })
    },

    getByFilename: (filename) => lodash.get(data, filename, null)
  }
}

const util = require('./util')

function onAnnouncement (ss) {
  return (req, res, next) => {
    const platform = req.params.platform
    const arch = req.params.arch
    const version = req.params.version

    const announcement = ss.announcements.get(platform, arch, version)
    if (announcement === null) return res.status(204).send('No announcements.')

    return res.status(200).json(announcement)
  }
}

function onUpdate (ss) {
  return (req, res) => {
    const platform = req.params.platform
    const arch = req.params.arch
    const version = req.params.version

    let obj = ss.releases.get(platform, arch, `>${version}`)
    if (obj === null) return res.status(204).send('No updates.')

    return res.status(200).send({
      url: util.downloadUrl(req, '/../../../../', obj.filename),
      name: obj.version,
      notes: '',
      pub_date: new Date().toISOString()
    })
  }
}

function onUpdateWin (ss) {
  return (req, res) => {
    const platform = req.params.platform
    const arch = req.params.arch
    const version = req.params.version

    const releases = ss.releases.getRELEASES(platform, arch, `>=${version}`)
    const content = releases.map((obj) => {
      return [ obj.hash, util.downloadUrl(req, '/../../../../../', obj.filename), obj.size ].join(' ')
    })
    .join('\n')

    return res.header('Content-Length', content.length).attachment('RELEASES').send(content)
  }
}

function onDownload (ss) {
  return (req, res) => {
    const filename = req.params.filename
    let path = null

    let obj
    if (filename) {
      obj = ss.releases.getByFilename(filename)
    } else {
      let platform = req.params.platform
      let arch = req.params.arch
      let version = req.params.version

      if (platform === undefined) {
        if (req.useragent.isMac) platform = 'darwin'
        else if (req.useragent.isLinux) platform = 'linux'
        else if (req.useragent.isWindows) platform = 'win32'
      }

      if (arch === undefined) {
        // right now only x64
        arch = 'x64'
        // arch = (req.useragent.isMac || req.useragent.isLinux64) ? 'x64' : 'ia32'
      }

      if (version === undefined) {
        version = 'latest'
      } else {
        version = `=${version}`
      }

      obj = ss.releases.get(platform, arch, version)
    }

    if (obj === null) return res.status(404).send('File not found.')

    return res.attachment(obj.filename).sendFile(obj.path)
  }
}

module.exports = {
  onAnnouncement,
  onUpdate,
  onUpdateWin,
  onDownload
}

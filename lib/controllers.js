'use strict'
const util = require('./util')

module.exports = (announcements, releases) => ({
  onAnnouncement (req, res, next) {
    const { platform, arch, version } = req.params

    const announcement = announcements.get(platform, arch, version)
    if (announcement === null) return res.status(204).send('No announcements.')

    return res.status(200).json(announcement)
  },

  onUpdate (req, res) {
    const { platform, arch, version } = req.params

    let obj = releases.get(platform, arch, `>${version}`)
    if (obj === null) return res.status(204).send('No updates.')

    return res.status(200).send({
      url: util.downloadUrl(req, '/../../../../', obj.filename),
      name: obj.version,
      notes: '',
      pub_date: new Date().toISOString(),
      version: obj.version
    })
  },

  onUpdateWin (req, res) {
    const { platform, arch, version } = req.params

    const items = releases.getRELEASES(platform, arch, `>=${version}`)
    const content = items.map((obj) => {
      const downloadUrl = util.downloadUrl(req, '/../../../../../', obj.filename)
      return [ obj.hash, downloadUrl, obj.size ].join(' ')
    })
    .join('\r\n')

    return res.header('Content-Length', content.length).attachment('RELEASES').send(content)
  },

  onDownload (req, res) {
    const { filename, platform, arch, version } = req.params

    let obj
    if (filename) {
      obj = releases.getByFilename(filename)
    } else {
      obj = releases.get(platform, arch, version === 'latest' ? 'latest' : `=${version}`)
    }

    if (obj === null) return res.status(404).send('File not found.')
    return res.attachment(obj.filename).sendFile(obj.path)
  }
})

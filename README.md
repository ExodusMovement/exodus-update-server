# exodus-update-server

* [Installation](#installation)
* [Data directory](#data-directory)
* [announcements.json](#announcementsjson)
* [Router](#router)
* [Programmatic API](#programmatic-api)
* [Default server](#default-server)

## Installation

```
$ git clone git@github.com:ExodusMovement/exodus-update-server.git
$ cd exodus-update-server
$ npm install
```

## Data directory

```
./data
├── announcements.json
└─┬ releases
  ├── Exodus-1.0.0-darwin-x64.dmg
  ├── Exodus-1.0.0-darwin-x64.zip
  ├── Exodus-1.0.0-linux-ia32.zip
  ├── Exodus-1.0.0-linux-x64.zip
  ├── Exodus-1.0.0-win32-ia32.exe
  ├── Exodus-1.0.0-win32-ia32-delta.nupkg
  ├── Exodus-1.0.0-win32-ia32-full.nupkg
  ├── Exodus-1.0.0-win32-x64.exe
  ├── Exodus-1.0.0-win32-x64-delta.nupkg
  ├── Exodus-1.0.0-win32-x64-full.nupkg
  └── ... and so on
```

## announcements.json

Simple example:

```json
{
  "<1.0.0": {
    "darwin": {
      "x64": [{
        "id": "<1.0.0-darwin-x64-0",
        "title": "Special Exodus Announcement",
        "message": "Version 1.0.0 was released! Update immediately!",
        "force": true
      }]
    },
    "linux": {
      "x64": [{
        "id": "<1.0.0-linux-x64-0",
        "title": "Special Exodus Announcement",
        "message": "Version 1.0.0 was released! Update immediately!",
        "force": true
      }]
    },
    "win32": {
      "x64": [{
        "id": "<1.0.0-win32-x64-0",
        "title": "Special Exodus Announcement",
        "message": "Version 1.0.0 was released! Update immediately!",
        "force": true
      }]
    }
  }
}
```

## Router

* `/announcement/:platform/:arch/:version`
* `/update/:platform/:arch/:version`
* `/update/:platform/:arch/:version/RELEASES`
* `/download/:filename`
* `/download/:platform/:arch/:version`

## Programmatic API

```js
const express = require('express')
const EUS = require('exodus-update-server')

const app = express()
app.use('/desktop', EUS.Router({ datadir: '...' }))

app.listen(...)
```

## Default server

You can start default server with `npm start`.

Available options:

  * `datadir` (by default `data` directory)
  * `path` (by default `desktop`)
  * `port` (by default 8000)

```
$ npm start -- --datadir=~/exodus-datadir --path='/desktop-updates' --port=80
```

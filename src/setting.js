const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const {app, BrowserWindow} = require('electron')

const portableDir = process.env.PORTABLE_EXECUTABLE_DIR

for (let dir of [
  (exports.userDataDirectory = portableDir
    ? path.join(portableDir, 'Renju')
    : app.getPath('userData')),
  (exports.themesDirectory = path.join(exports.userDataDirectory, 'themes')),
]) {
  try {
    fs.mkdirSync(dir)
  } catch (err) {}
}

exports.settingsPath = path.join(exports.userDataDirectory, 'settings.json')
exports.stylesPath = path.join(exports.userDataDirectory, 'styles.css')

if (!fs.existsSync(exports.stylesPath)) {
  fs.writeFileSync(
    exports.stylesPath,
    `/* This stylesheet is loaded when ${app.name} starts up. */`,
  )
}

let settings = {}

let themesDict = null

let defaults = {
  'app.always_show_result': false,
  'app.enable_hardware_acceleration': true,
  'app.hide_busy_delay': 200,
  'app.lang': 'en',
  'app.loadgame_delay': 100,
  'app.startup_check_updates': true,
  'app.startup_check_updates_delay': 3000,
  'app.zoom_factor': 1,
  'autoplay.max_sec_per_move': 99,
  'autoplay.sec_per_move': 1,
  'autoscroll.delay': 400,
  'autoscroll.diff': 10,
  'autoscroll.max_interval': 200,
  'autoscroll.min_interval': 50,
  'board.variation_replay_mode': 'move_by_move',
  'board.variation_replay_interval': 500,
  'cleanmarkup.annotations': false,
  'cleanmarkup.arrow': true,
  'cleanmarkup.circle': true,
  'cleanmarkup.comments': false,
  'cleanmarkup.cross': true,
  'cleanmarkup.hotspots': false,
  'cleanmarkup.label': true,
  'cleanmarkup.line': true,
  'cleanmarkup.square': true,
  'cleanmarkup.triangle': true,
  'comments.show_move_interpretation': true,
  'comments.commit_delay': 500,
  'debug.dev_tools': false,
  'edit.click_currentvertex_to_remove': true,
  'edit.copy_variation_strip_props': [
    'AP',
    'CA',
    'FF',
    'GM',
    'ST',
    'SZ',
    'AN',
    'BR',
    'BT',
    'CP',
    'DT',
    'EV',
    'GN',
    'GC',
    'ON',
    'OT',
    'PB',
    'PC',
    'PW',
    'RE',
    'RO',
    'RU',
    'SO',
    'TM',
    'US',
    'WR',
    'WT',
  ],
  'edit.flatten_inherit_root_props': [
    'BR',
    'BT',
    'DT',
    'EV',
    'GN',
    'GC',
    'PB',
    'PW',
    'RE',
    'SO',
    'SZ',
    'WT',
    'WR',
  ],
  'edit.history_batch_interval': 500,
  'edit.max_history_count': 1000,
  'edit.show_removenode_warning': true,
  'edit.show_removeothervariations_warning': true,
  'file.show_reload_warning': true,
  'find.delay': 100,
  'game.default_board_size': 15,
  'game.goto_end_after_loading': false,
  'game.navigation_sensitivity': 40,
  'gamechooser.show_delay': 100,
  'gamechooser.thumbnail_size': 153,
  'graph.delay': 100,
  'graph.grid_size': 22,
  'graph.node_size': 4,
  'sgf.comment_properties': [
    'C',
    'N',
    'UC',
    'GW',
    'DM',
    'GB',
    'BM',
    'TE',
    'DO',
    'IT',
  ],
  'sgf.format_code': false,
  'sound.enable': true,
  'theme.custom_whitestones': null,
  'theme.custom_blackstones': null,
  'theme.custom_board': null,
  'theme.custom_background': null,
  'theme.current': null,
  'view.animated_stone_placement': true,
  'view.coordinates_type': 'A1',
  'view.fuzzy_stone_placement': true,
  'view.properties_height': 50,
  'view.properties_minheight': 20,
  'view.show_menubar': true,
  'view.show_comments': false,
  'view.show_coordinates': false,
  'view.show_graph': false,
  'view.show_move_colorization': true,
  'view.show_move_numbers': false,
  'view.show_next_moves': true,
  'view.show_siblings': true,
  'view.sidebar_width': 200,
  'view.sidebar_minwidth': 100,
  'infooverlay.duration': 2000,
  'window.height': 604,
  'window.minheight': 440,
  'window.minwidth': 526,
  'window.width': 564,
  'window.maximized': false,
}

let eventEmitters = {}

exports.events = {
  on: (id, event, f) => {
    if (eventEmitters[id] == null) {
      eventEmitters[id] = new EventEmitter()
      eventEmitters[id].setMaxListeners(30)
    }

    eventEmitters[id].on(event, f)
  },
  emit: (event, evt) => {
    let windows = BrowserWindow.getAllWindows()

    for (let id in eventEmitters) {
      if (!windows.some((window) => window.id.toString() === id)) {
        delete eventEmitters[id]
      } else {
        eventEmitters[id].emit(event, evt)
      }
    }
  },
}

exports.load = function () {
  try {
    settings = JSON.parse(fs.readFileSync(exports.settingsPath, 'utf8'))
  } catch (err) {
    settings = {}
  }

  // Load default settings

  for (let key in defaults) {
    if (key in settings) continue
    settings[key] = defaults[key]
  }

  // Delete invalid settings

  for (let key in settings) {
    if (key in defaults) continue
    delete settings[key]
  }

  // Overwrite settings

  for (let overwriteKey in settings) {
    if (overwriteKey.indexOf('setting.overwrite.') != 0) continue

    let overwrites = settings[overwriteKey]
    if (!overwrites.length) continue

    for (let i = 0; i < overwrites.length; i++) {
      settings[overwrites[i]] = defaults[overwrites[i]]
    }

    settings[overwriteKey] = []
  }

  return exports.save()
}

exports.loadThemes = function () {
  let packagePath = (filename) =>
    path.join(exports.themesDirectory, filename, 'package.json')
  let friendlyName = (name) =>
    name
      .split('-')
      .map((x) =>
        x === '' ? x : x[0].toUpperCase() + x.slice(1).toLowerCase(),
      )
      .join(' ')

  themesDict = fs
    .readdirSync(exports.themesDirectory)
    .map((x) => {
      try {
        return Object.assign({}, require(packagePath(x)), {
          id: x,
          path: path.join(packagePath(x), '..'),
        })
      } catch (err) {
        return null
      }
    })
    .reduce((acc, x) => {
      if (x == null) return acc

      x.name = friendlyName(x.name)
      acc[x.id] = x
      return acc
    }, {})
}

exports.save = function () {
  let keys = Object.keys(settings).sort()

  fs.writeFileSync(
    exports.settingsPath,
    JSON.stringify(
      keys.reduce((acc, key) => ((acc[key] = settings[key]), acc), {}),
      null,
      '  ',
    ),
  )

  return exports
}

exports.get = function (key) {
  if (key in settings) return settings[key]
  if (key in defaults) return defaults[key]
  return null
}

exports.set = function (key, value) {
  settings[key] = value
  exports.save()
  exports.events.emit('change', {key, value})
  return exports
}

exports.getThemes = function () {
  if (themesDict == null) exports.loadThemes()
  return themesDict
}

exports.load()

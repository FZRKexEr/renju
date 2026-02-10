import {ipcRenderer} from 'electron'
import {h, render, Component} from 'preact'
import classNames from 'classnames'
import fixPath from 'fix-path'

import TripleSplitContainer from './helpers/TripleSplitContainer.js'
import ThemeManager from './ThemeManager.js'
import MainMenu from './MainMenu.js'
import MainView from './MainView.js'
import Sidebar from './Sidebar.js'
import DrawerManager from './DrawerManager.js'
import InputBox from './InputBox.js'
import BusyScreen from './BusyScreen.js'
import InfoOverlay from './InfoOverlay.js'

import i18n from '../i18n.js'
import sabaki from '../modules/sabaki.js'
import * as gametree from '../modules/gametree.js'
import * as helper from '../modules/helper.js'

const setting = {
  get: (key) => window.sabaki.setting.get(key),
  set: (key, value) => {
    window.sabaki.setting.set(key, value)
    return setting
  },
}
const t = i18n.context('App')

const sidebarMinWidth = setting.get('view.sidebar_minwidth')

fixPath()
const portableDir = process.env.PORTABLE_EXECUTABLE_DIR
if (portableDir) process.chdir(portableDir)

class App extends Component {
  constructor(props) {
    super(props)

    this.state = sabaki.state

    sabaki.on('change', ({change, callback}) => {
      this.setState(change, callback)
    })

    let bind = (f) => f.bind(this)
    this.handleMainLayoutSplitChange = bind(this.handleMainLayoutSplitChange)
    this.handleMainLayoutSplitFinish = bind(this.handleMainLayoutSplitFinish)
  }

  componentDidMount() {
    window.addEventListener('contextmenu', (evt) => {
      evt.preventDefault()
    })

    window.addEventListener('load', () => {
      sabaki.events.emit('ready')
    })

    ipcRenderer.on('load-file', (evt, ...args) => {
      setTimeout(
        () => sabaki.loadFile(...args),
        setting.get('app.loadgame_delay'),
      )
    })

    sabaki.window.on('focus', () => {
      if (setting.get('file.show_reload_warning')) {
        sabaki.askForReload()
      }
    })

    sabaki.window.on('resize', () => {
      clearTimeout(this.resizeId)

      this.resizeId = setTimeout(() => {
        if (
          !sabaki.window.isMaximized() &&
          !sabaki.window.isMinimized() &&
          !sabaki.window.isFullScreen()
        ) {
          let [width, height] = sabaki.window.getContentSize()
          setting.set('window.width', width).set('window.height', height)
        }
      }, 1000)
    })

    // Handle mouse wheel

    for (let el of document.querySelectorAll('#main main, #graph')) {
      el.addEventListener('wheel', (evt) => {
        evt.preventDefault()

        if (this.residueDeltaY == null) this.residueDeltaY = 0
        this.residueDeltaY += evt.deltaY

        if (
          Math.abs(this.residueDeltaY) >=
          setting.get('game.navigation_sensitivity')
        ) {
          sabaki.goStep(Math.sign(this.residueDeltaY))
          this.residueDeltaY = 0
        }
      })
    }

    // Handle file drag & drop

    document.body.addEventListener('dragover', (evt) => evt.preventDefault())
    document.body.addEventListener('drop', (evt) => {
      evt.preventDefault()

      if (evt.dataTransfer.files.length === 0) return
      const filePath = window.sabaki.getPathForFile(evt.dataTransfer.files[0])
      sabaki.loadFile(filePath)
    })

    // Handle keys

    document.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape') {
        if (sabaki.state.openDrawer != null) {
          sabaki.closeDrawer()
        } else if (sabaki.state.mode !== 'play') {
          sabaki.setMode('play')
        } else if (sabaki.state.fullScreen) {
          sabaki.setState({fullScreen: false})
        }
      } else if (
        !evt.ctrlKey &&
        !evt.metaKey &&
        ['ArrowUp', 'ArrowDown'].includes(evt.key)
      ) {
        if (
          sabaki.state.busy > 0 ||
          helper.isTextLikeElement(document.activeElement)
        )
          return

        evt.preventDefault()

        let sign = evt.key === 'ArrowUp' ? -1 : 1
        sabaki.startAutoscrolling(sign)
      } else if (
        (evt.ctrlKey || evt.metaKey) &&
        ['z', 'y'].includes(evt.key.toLowerCase())
      ) {
        if (sabaki.state.busy > 0) return

        // Hijack browser undo/redo

        evt.preventDefault()

        let step = evt.key.toLowerCase() === 'z' ? -1 : 1
        if (evt.shiftKey) step = -step

        let action = step < 0 ? 'undo' : 'redo'

        if (action != null) {
          if (helper.isTextLikeElement(document.activeElement)) {
            sabaki.window.webContents[action]()
          } else {
            sabaki[action]()
          }
        }
      }
    })

    document.addEventListener('keyup', (evt) => {
      if (['ArrowUp', 'ArrowDown'].includes(evt.key)) {
        sabaki.stopAutoscrolling()
      }
    })

    // Handle window closing

    window.addEventListener('beforeunload', (evt) => {
      if (this.closeWindow) return

      evt.returnValue = ' '

      setTimeout(async () => {
        if (await sabaki.askForSave()) {
          this.closeWindow = true
          sabaki.window.close()
        }
      })
    })

    sabaki.newFile()
  }

  componentDidUpdate(_, prevState = {}) {
    // Update title

    let {title} = sabaki.inferredState
    if (document.title !== title) document.title = title

    // Handle full screen & show menu bar

    if (prevState.fullScreen !== sabaki.state.fullScreen) {
      if (sabaki.state.fullScreen)
        sabaki.flashInfoOverlay(t('Press Esc to exit full screen mode'))
      sabaki.window.setFullScreen(sabaki.state.fullScreen)
    }

    if (prevState.showMenuBar !== sabaki.state.showMenuBar) {
      if (!sabaki.state.showMenuBar)
        sabaki.flashInfoOverlay(t('Press Alt to show menu bar'))
      sabaki.window.setMenuBarVisibility(sabaki.state.showMenuBar)
      sabaki.window.autoHideMenuBar = !sabaki.state.showMenuBar
    }

    // Handle sidebar showing/hiding

    let {showSidebar: prevShowSidebar} = sabaki.getInferredState(prevState)

    if (prevShowSidebar !== sabaki.inferredState.showSidebar) {
      let [width, height] = sabaki.window.getContentSize()
      let widthDiff =
        sabaki.state.sidebarWidth *
        (sabaki.inferredState.showSidebar ? 1 : -1)

      if (
        !sabaki.window.isMaximized() &&
        !sabaki.window.isMinimized() &&
        !sabaki.window.isFullScreen()
      ) {
        sabaki.window.setContentSize(Math.floor(width + widthDiff), height)
      }

      window.dispatchEvent(new Event('resize'))
    }

    // Handle zoom factor

    if (prevState.zoomFactor !== sabaki.state.zoomFactor) {
      sabaki.window.webContents.zoomFactor = sabaki.state.zoomFactor
    }
  }

  // User Interface

  handleMainLayoutSplitChange({endSideSize}) {
    sabaki.setState(
      ({sidebarWidth}) => ({
        sidebarWidth: sabaki.inferredState.showSidebar
          ? Math.max(endSideSize, sidebarMinWidth)
          : sidebarWidth,
      }),
      () => window.dispatchEvent(new Event('resize')),
    )
  }

  handleMainLayoutSplitFinish() {
    setting.set('view.sidebar_width', this.state.sidebarWidth)
  }

  // Render

  render(_, state) {
    // Calculate some inferred values

    let inferredState = sabaki.inferredState

    state = {...state, ...inferredState}

    return h(
      'section',
      {
        class: classNames({
          showsidebar: state.showSidebar,
          [state.mode]: true,
        }),
      },

      h(ThemeManager),
      h(MainMenu, {
        showMenuBar: state.showMenuBar,
        disableAll: state.busy > 0,
        showCoordinates: state.showCoordinates,
        coordinatesType: state.coordinatesType,
        showMoveNumbers: state.showMoveNumbers,
        showMoveColorization: state.showMoveColorization,
        showNextMoves: state.showNextMoves,
        showSiblings: state.showSiblings,
        showGameGraph: state.showGameGraph,
        showCommentBox: state.showCommentBox,
      }),

      h(TripleSplitContainer, {
        id: 'mainlayout',

        beginSideSize: 0,
        endSideSize: state.showSidebar ? state.sidebarWidth : 0,

        beginSideContent: null,
        mainContent: h(MainView, state),
        endSideContent: h(Sidebar, state),

        onChange: this.handleMainLayoutSplitChange,
        onFinish: this.handleMainLayoutSplitFinish,
      }),

      h(DrawerManager, state),

      h(InputBox, {
        text: state.inputBoxText,
        show: state.showInputBox,
        onSubmit: state.onInputBoxSubmit,
        onCancel: state.onInputBoxCancel,
      }),

      h(BusyScreen, {show: state.busy > 0}),
      h(InfoOverlay, {
        text: state.infoOverlayText,
        show: state.showInfoOverlay,
      }),
    )
  }
}

// Render

render(h(App), document.body)

import {h, Component} from 'preact'

import Goban from './Goban.js'
import PlayBar from './bars/PlayBar.js'
import EditBar from './bars/EditBar.js'
import GuessBar from './bars/GuessBar.js'
import AutoplayBar from './bars/AutoplayBar.js'
import FindBar from './bars/FindBar.js'

import sabaki from '../modules/sabaki.js'
import * as gametree from '../modules/gametree.js'

export default class MainView extends Component {
  constructor(props) {
    super(props)

    this.handleTogglePlayer = () => {
      let {gameTree, treePosition, currentPlayer} = this.props
      sabaki.setPlayer(treePosition, -currentPlayer)
    }

    this.handleToolButtonClick = (evt) => {
      sabaki.setState({selectedTool: evt.tool})
    }

    this.handleFindButtonClick = (evt) =>
      sabaki.findMove(evt.step, {
        vertex: this.props.findVertex,
        text: this.props.findText,
      })

    this.handleGobanVertexClick = this.handleGobanVertexClick.bind(this)
    this.handleGobanLineDraw = this.handleGobanLineDraw.bind(this)
  }

  componentDidMount() {
    // Pressing Ctrl/Cmd should show crosshair cursor on Goban in edit mode

    document.addEventListener('keydown', (evt) => {
      if (evt.key !== 'Control' || evt.key !== 'Meta') return

      if (this.props.mode === 'edit') {
        this.setState({gobanCrosshair: true})
      }
    })

    document.addEventListener('keyup', (evt) => {
      if (evt.key !== 'Control' || evt.key !== 'Meta') return

      if (this.props.mode === 'edit') {
        this.setState({gobanCrosshair: false})
      }
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.mode !== 'edit') {
      this.setState({gobanCrosshair: false})
    }
  }

  handleGobanVertexClick(evt) {
    sabaki.clickVertex(evt.vertex, evt)
  }

  handleGobanLineDraw(evt) {
    let {v1, v2} = evt.line
    sabaki.useTool(this.props.selectedTool, v1, v2)
    sabaki.editVertexData = null
  }

  render(
    {
      mode,
      gameIndex,
      gameTree,
      gameCurrents,
      treePosition,
      currentPlayer,
      gameInfo,

      playVariation,
      blockedGuesses,

      highlightVertices,
      showCoordinates,
      showMoveColorization,
      showMoveNumbers,
      showNextMoves,
      showSiblings,
      fuzzyStonePlacement,
      animateStonePlacement,
      boardTransformation,

      selectedTool,
      findText,
      findVertex,
    },
    {gobanCrosshair},
  ) {
    let node = gameTree.get(treePosition)
    let board = gametree.getBoard(gameTree, treePosition)
    let paintMap

    if (mode === 'guess') {
      paintMap = [...Array(board.height)].map((_) => Array(board.width).fill(0))

      for (let [x, y] of blockedGuesses) {
        paintMap[y][x] = 1
      }
    }

    return h(
      'section',
      {id: 'main'},

      h(
        'main',
        {ref: (el) => (this.mainElement = el)},

        h(Goban, {
          gameTree,
          treePosition,
          board,
          highlightVertices:
            findVertex && mode === 'find' ? [findVertex] : highlightVertices,
          paintMap,
          dimmedStones: [],

          crosshair: gobanCrosshair,
          showCoordinates,
          showMoveColorization,
          showMoveNumbers: mode !== 'edit' && showMoveNumbers,
          showNextMoves: mode !== 'guess' && showNextMoves,
          showSiblings: mode !== 'guess' && showSiblings,
          fuzzyStonePlacement,
          animateStonePlacement,

          playVariation,
          drawLineMode:
            mode === 'edit' && ['arrow', 'line'].includes(selectedTool)
              ? selectedTool
              : null,
          transformation: boardTransformation,

          onVertexClick: this.handleGobanVertexClick,
          onLineDraw: this.handleGobanLineDraw,
        }),
      ),

      h(
        'section',
        {id: 'bar'},
        h(PlayBar, {
          mode,
          playerNames: gameInfo.playerNames,
          playerRanks: gameInfo.playerRanks,
          currentPlayer,
          showHotspot: node.data.HO != null,
          onCurrentPlayerClick: this.handleTogglePlayer,
        }),

        h(EditBar, {
          mode,
          selectedTool,
          onToolButtonClick: this.handleToolButtonClick,
        }),

        h(GuessBar, {
          mode,
          treePosition,
        }),

        h(AutoplayBar, {
          mode,
          gameTree,
          gameCurrents: gameCurrents[gameIndex],
          treePosition,
        }),

        h(FindBar, {
          mode,
          findText,
          onButtonClick: this.handleFindButtonClick,
        }),
      ),
    )
  }
}

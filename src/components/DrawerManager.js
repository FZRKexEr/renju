import {h, Component} from 'preact'
import sabaki from '../modules/sabaki.js'

import InfoDrawer from './drawers/InfoDrawer.js'
import PreferencesDrawer from './drawers/PreferencesDrawer.js'
import GameChooserDrawer from './drawers/GameChooserDrawer.js'
import CleanMarkupDrawer from './drawers/CleanMarkupDrawer.js'
import AdvancedPropertiesDrawer from './drawers/AdvancedPropertiesDrawer.js'

export default class DrawerManager extends Component {
  constructor() {
    super()

    this.handleGameSelect = ({selectedTree}) => {
      sabaki.closeDrawer()
      sabaki.setMode('play')
      sabaki.setCurrentTreePosition(selectedTree, selectedTree.root.id)
    }

    this.handleGameTreesChange = (evt) => {
      let newGameTrees = evt.gameTrees
      let {gameTrees, gameCurrents, gameIndex} = this.props
      let tree = gameTrees[gameIndex]
      let newIndex = newGameTrees.findIndex((t) => t.root.id === tree.root.id)

      if (newIndex < 0) {
        if (newGameTrees.length === 0)
          newGameTrees = [sabaki.getEmptyGameTree()]

        newIndex = Math.min(Math.max(gameIndex - 1, 0), newGameTrees.length - 1)
        tree = newGameTrees[newIndex]
      }

      sabaki.setState({
        gameTrees: newGameTrees,
        gameCurrents: newGameTrees.map((tree, i) => {
          let oldIndex = gameTrees.findIndex((t) => t.root.id === tree.root.id)
          if (oldIndex < 0) return {}

          return gameCurrents[oldIndex]
        }),
      })

      sabaki.setCurrentTreePosition(tree, tree.root.id)
    }
  }

  render({
    openDrawer,
    gameTree,
    gameTrees,
    gameIndex,
    treePosition,

    gameInfo,
    currentPlayer,

    graphGridSize,
    preferencesTab,
  }) {
    return h(
      'section',
      {},
      h(InfoDrawer, {
        show: openDrawer === 'info',
        gameTree,
        gameInfo,
        currentPlayer,
      }),

      h(PreferencesDrawer, {
        show: openDrawer === 'preferences',
        tab: preferencesTab,
        graphGridSize,
      }),

      h(GameChooserDrawer, {
        show: openDrawer === 'gamechooser',
        gameTrees,
        gameIndex,

        onItemClick: this.handleGameSelect,
        onChange: this.handleGameTreesChange,
      }),

      h(CleanMarkupDrawer, {
        show: openDrawer === 'cleanmarkup',
        gameTree,
        treePosition,
      }),

      h(AdvancedPropertiesDrawer, {
        show: openDrawer === 'advancedproperties',
        gameTree,
        treePosition,
      }),
    )
  }
}

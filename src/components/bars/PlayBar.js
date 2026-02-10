import {h, Component} from 'preact'
import classNames from 'classnames'

import i18n from '../../i18n.js'
import sabaki from '../../modules/sabaki.js'
import * as helper from '../../modules/helper.js'

const t = i18n.context('PlayBar')

export default class PlayBar extends Component {
  constructor(props) {
    super(props)

    this.handleCurrentPlayerClick = () => this.props.onCurrentPlayerClick

    this.handleMenuClick = () => {
      let {left, top} = this.menuButtonElement.getBoundingClientRect()

      helper.popupMenu(
        [
          {
            label: t('&Edit'),
            click: () => sabaki.setMode('edit'),
          },
          {
            label: t('&Find'),
            click: () => sabaki.setMode('find'),
          },
          {type: 'separator'},
          {
            label: t('&Info'),
            click: () => sabaki.openDrawer('info'),
          },
        ],
        left,
        top,
      )
    }
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.mode !== this.props.mode || nextProps.mode === 'play'
  }

  render(
    {
      mode,
      playerNames,
      playerRanks,
      currentPlayer,
      showHotspot,

      onCurrentPlayerClick = helper.noop,
    },
  ) {
    return h(
      'header',
      {
        class: classNames({
          hotspot: showHotspot,
          current: mode === 'play',
        }),
      },

      h('div', {class: 'hotspot', title: t('Hotspot')}),

      h(
        'span',
        {class: 'playercontent player_1'},

        playerRanks[0] &&
          h('span', {class: 'rank'}, playerRanks[0]),
        ' ',

        h(
          'span',
          {class: 'name'},
          playerNames[0] || t('Black'),
        ),
      ),

      h(
        'a',
        {
          class: 'current-player',
          title: t('Change Player'),
          onClick: onCurrentPlayerClick,
        },
        h('img', {
          src: `./img/ui/player_${currentPlayer}.svg`,
          height: 21,
          alt: currentPlayer < 0 ? t('White to play') : t('Black to play'),
        }),
      ),

      h(
        'span',
        {class: 'playercontent player_-1'},
        h(
          'span',
          {class: 'name'},
          playerNames[1] || t('White'),
        ),
        ' ',

        playerRanks[1] &&
          h('span', {class: 'rank'}, playerRanks[1]),
      ),

      h(
        'a',
        {
          ref: (el) => (this.menuButtonElement = el),
          class: 'menu',
          onClick: this.handleMenuClick,
        },
        h('img', {
          src: './node_modules/@primer/octicons/build/svg/three-bars.svg',
          height: 22,
        }),
      ),
    )
  }
}

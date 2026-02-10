import classNames from 'classnames'
import {h, Component, toChildArray} from 'preact'
import Pikaday from 'pikaday'
import {parseDates, stringifyDates} from '@sabaki/sgf'

import sabaki from '../../modules/sabaki.js'
import {shallowEquals, lexicalCompare, noop} from '../../modules/helper.js'
import i18n from '../../i18n.js'

import Drawer from './Drawer.js'

const t = i18n.context('InfoDrawer')
const setting = {get: (key) => window.sabaki.setting.get(key)}

class InfoDrawerItem extends Component {
  render({title, children}) {
    children = toChildArray(children)

    return h(
      'li',
      {},
      h('label', {}, h('span', {}, title + ':'), children[0]),
      children.slice(1),
    )
  }
}

export default class InfoDrawer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showResult: false,
      blackName: null,
      blackRank: null,
      whiteName: null,
      whiteRank: null,
      gameName: null,
      eventName: null,
      gameComment: null,
      date: null,
      result: null,
      size: [null, null],
    }

    this.handleSubmitButtonClick = async (evt) => {
      evt.preventDefault()

      let emptyTree = this.props.gameTree.root.children.length === 0
      let keys = [
        'blackName',
        'blackRank',
        'whiteName',
        'whiteRank',
        'gameName',
        'eventName',
        'gameComment',
        'date',
        'result',
      ]

      let data = keys.reduce((acc, key) => {
        acc[key] =
          Array.isArray(this.state[key]) &&
          this.state[key].every((x) => x == null)
            ? null
            : this.state[key]
        return acc
      }, {})

      if (emptyTree) {
        data.size = this.state.size
      }

      sabaki.setGameInfo(data)
      sabaki.closeDrawer()
    }

    this.handleCancelButtonClick = (evt) => {
      evt.preventDefault()
      sabaki.closeDrawer()
    }

    this.handleBoardWidthFocus = () => {
      this.combinedSizeFields = this.state.size[0] === this.state.size[1]
    }

    this.handleBoardWidthChange = (evt) => {
      let {value} = evt.currentTarget
      if (value === '' || isNaN(value)) value = null
      else value = +value

      this.setState(({size: [, height]}) => ({
        size: [value, this.combinedSizeFields ? value : height],
      }))
    }

    this.handleBoardHeightChange = (evt) => {
      let {value} = evt.currentTarget
      if (value === '' || isNaN(value)) value = null
      else value = +value

      this.setState(({size: [width]}) => ({size: [width, value]}))
    }

    this.handleSizeSwapButtonClick = () => {
      this.setState(({size}) => ({size: size.reverse()}))
    }

    this.handleSwapPlayers = () => {
      this.setState(({blackName, blackRank, whiteName, whiteRank}) => ({
        blackName: whiteName,
        whiteName: blackName,
        blackRank: whiteRank,
        whiteRank: blackRank,
      }))
    }

    this.handleDateInputChange = (evt) => {
      this.setState({date: evt.currentTarget.value})
      this.markDates()
    }

    this.handleDateInputFocus = () => {
      this.pikaday.show()
    }

    this.handleDateInputBlur = () => {
      setTimeout(() => {
        if (!this.elementInPikaday(document.activeElement)) this.pikaday.hide()
      }, 50)
    }

    this.handleShowResultClick = () => {
      this.setState({showResult: true})
    }

    this.handleInputChange = [
      'blackRank',
      'blackName',
      'whiteRank',
      'whiteName',
      'gameName',
      'eventName',
      'gameComment',
      'result',
    ].reduce((acc, key) => {
      acc[key] = ({currentTarget}) => {
        this.setState({
          [key]: currentTarget.value === '' ? null : currentTarget.value,
        })
      }

      return acc
    }, {})
  }

  componentWillReceiveProps({gameInfo, show}) {
    if (!this.props.show && show) {
      this.setState({
        ...gameInfo,
        showResult:
          !gameInfo.result ||
          gameInfo.result.trim() === '' ||
          setting.get('app.always_show_result') === true,
      })
    }
  }

  componentDidMount() {
    this.preparePikaday()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.show && this.props.show) {
      this.firstFocusElement.focus()
    }
  }

  shouldComponentUpdate({show}) {
    return show !== this.props.show || show
  }

  markDates() {
    let dates = (parseDates(this.state.date || '') || []).filter(
      (x) => x.length === 3,
    )

    for (let el of this.pikaday.el.querySelectorAll('.pika-button')) {
      let year = +el.dataset.pikaYear
      let month = +el.dataset.pikaMonth
      let day = +el.dataset.pikaDay

      el.parentElement.classList.toggle(
        'is-multi-selected',
        dates.some((d) => {
          return shallowEquals(d, [year, month + 1, day])
        }),
      )
    }
  }

  adjustPikadayPosition() {
    let {left, top} = this.dateInputElement.getBoundingClientRect()
    let {el} = this.pikaday
    let {height} = el.getBoundingClientRect()

    el.style.position = 'absolute'
    el.style.left = Math.round(left) + 'px'
    el.style.top = Math.round(top - height) + 'px'
  }

  elementInPikaday(element) {
    while (element.parentElement) {
      if (element === this.pikaday.el) return true
      element = element.parentElement
    }

    return false
  }

  preparePikaday() {
    this.pikaday = new Pikaday({
      position: 'top left',
      firstDay: 1,
      yearRange: 6,
      keyboardInput: false,
      i18n: {
        previousMonth: t('Previous Month'),
        nextMonth: t('Next Month'),
        months: [...Array(12)].map((_, i) => i18n.formatMonth(i)),
        weekdays: [...Array(7)].map((_, i) => i18n.formatWeekday(i)),
        weekdaysShort: [...Array(7)].map((_, i) => i18n.formatWeekdayShort(i)),
      },

      onOpen: () => {
        if (!this.pikaday) return

        let dates = (parseDates(this.state.date || '') || []).filter(
          (x) => x.length === 3,
        )

        if (dates.length > 0) {
          this.pikaday.setDate(dates[0].join('-'), true)
        } else {
          this.pikaday.gotoToday()
        }

        this.adjustPikadayPosition()
      },
      onDraw: () => {
        if (!this.pikaday || !this.pikaday.isVisible()) return

        this.adjustPikadayPosition()
        this.markDates()

        this.dateInputElement.focus()
      },
      onSelect: (date) => {
        if (!this.pikaday) return

        let dates = parseDates(this.state.date || '') || []
        date = [date.getFullYear(), date.getMonth() + 1, date.getDate()]

        if (!dates.some((x) => shallowEquals(x, date))) {
          dates.push(date)
        } else {
          dates = dates.filter((x) => !shallowEquals(x, date))
        }

        this.setState({
          date: stringifyDates(dates.sort(lexicalCompare)),
        })
        this.markDates()
      },
    })

    // Hack for removing keyboard input support of Pikaday
    document.removeEventListener('keydown', this.pikaday._onKeyChange)

    this.pikaday.hide()

    document.body.appendChild(this.pikaday.el)
    document.body.addEventListener('click', (evt) => {
      if (
        this.pikaday.isVisible() &&
        document.activeElement !== this.dateInputElement &&
        evt.target !== this.dateInputElement &&
        !this.elementInPikaday(evt.target)
      )
        this.pikaday.hide()
    })

    window.addEventListener('resize', () => this.adjustPikadayPosition())
  }

  render(
    {gameTree, currentPlayer, show},
    {
      showResult,
      blackName,
      blackRank,
      whiteName,
      whiteRank,
      gameName,
      eventName,
      gameComment,
      date,
      result,
      size,
    },
  ) {
    let emptyTree = gameTree.root.children.length === 0

    return h(
      Drawer,
      {
        type: 'info',
        show,
      },

      h(
        'form',
        {},
        h(
          'section',
          {},
          h(
            'span',
            {},

            h('input', {
              type: 'text',
              name: 'rank_1',
              placeholder: t('Rank'),
              value: blackRank,
              onInput: this.handleInputChange.blackRank,
            }),

            h('input', {
              ref: (el) => (this.firstFocusElement = el),
              type: 'text',
              name: 'name_1',
              placeholder: t('Black'),
              value: blackName,
              onInput: this.handleInputChange.blackName,
            }),
          ),

          h('img', {
            class: 'current-player',
            src: `./img/ui/player_${currentPlayer}.svg`,
            height: 31,
            title: t('Swap'),
            onClick: this.handleSwapPlayers,
          }),

          h(
            'span',
            {},
            h('input', {
              type: 'text',
              name: 'name_-1',
              placeholder: t('White'),
              value: whiteName,
              onInput: this.handleInputChange.whiteName,
            }),

            h('input', {
              type: 'text',
              name: 'rank_-1',
              placeholder: t('Rank'),
              value: whiteRank,
              onInput: this.handleInputChange.whiteRank,
            }),
          ),
        ),

        h(
          'ul',
          {},
          h(
            InfoDrawerItem,
            {title: t('Name')},
            h('input', {
              type: 'text',
              placeholder: t('(Unnamed)'),
              value: gameName,
              onInput: this.handleInputChange.gameName,
            }),
          ),
          h(
            InfoDrawerItem,
            {title: t('Event')},
            h('input', {
              type: 'text',
              placeholder: t('None'),
              value: eventName,
              onInput: this.handleInputChange.eventName,
            }),
          ),
          h(
            InfoDrawerItem,
            {title: t('Date')},
            h('input', {
              ref: (el) => (this.dateInputElement = el),
              type: 'text',
              placeholder: t('None'),
              value: date,

              onFocus: this.handleDateInputFocus,
              onBlur: this.handleDateInputBlur,
              onInput: this.handleDateInputChange,
            }),
          ),
          h(
            InfoDrawerItem,
            {title: t('Comment')},
            h('input', {
              type: 'text',
              placeholder: t('None'),
              value: gameComment,
              onInput: this.handleInputChange.gameComment,
            }),
          ),
          h(
            InfoDrawerItem,
            {title: t('Result')},
            showResult
              ? h('input', {
                  type: 'text',
                  placeholder: t('None'),
                  value: result,
                  onInput: this.handleInputChange.result,
                })
              : h(
                  'button',
                  {
                    type: 'button',
                    onClick: this.handleShowResultClick,
                  },
                  t('Show'),
                ),
          ),
          h(
            InfoDrawerItem,
            {title: t('Board Size')},
            h('input', {
              type: 'number',
              name: 'size-width',
              placeholder: 15,
              max: 25,
              min: 5,
              value: size[0],
              disabled: !emptyTree,
              onFocus: this.handleBoardWidthFocus,
              onInput: this.handleBoardWidthChange,
            }),
            ' ',

            h(
              'span',
              {
                title: t('Swap'),
                style: {cursor: emptyTree ? 'pointer' : 'default'},
                onClick: !emptyTree ? noop : this.handleSizeSwapButtonClick,
              },
              '×',
            ),
            ' ',

            h('input', {
              type: 'number',
              name: 'size-height',
              placeholder: 15,
              max: 25,
              min: 5,
              value: size[1],
              disabled: !emptyTree,
              onInput: this.handleBoardHeightChange,
            }),
          ),
        ),

        h(
          'p',
          {},
          h(
            'button',
            {type: 'submit', onClick: this.handleSubmitButtonClick},
            t('OK'),
          ),
          ' ',
          h(
            'button',
            {type: 'reset', onClick: this.handleCancelButtonClick},
            t('Cancel'),
          ),
        ),
      ),
    )
  }
}

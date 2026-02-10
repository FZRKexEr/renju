// Gomoku Board - Drop-in replacement for @sabaki/go-board
// Implements the same API surface but with Gomoku rules (no captures, no ko, no suicide)

const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

class GomokuBoard {
  constructor(width = 15, height = 15, signMap = null) {
    this.width = width
    this.height = height
    this.signMap =
      signMap ||
      [...Array(height)].map(() => Array(width).fill(0))

    this.markers = null
    this.lines = null
    this.childrenInfo = null
    this.siblingsInfo = null
    this.currentVertex = null
  }

  get(vertex) {
    let [x, y] = vertex
    if (!this.has(vertex)) return null
    return this.signMap[y][x]
  }

  set(vertex, sign) {
    let [x, y] = vertex
    if (this.has(vertex)) {
      this.signMap[y][x] = sign
    }
    return this
  }

  has(vertex) {
    let [x, y] = vertex
    return (
      x >= 0 && x < this.width &&
      y >= 0 && y < this.height
    )
  }

  clone() {
    let board = new GomokuBoard(
      this.width,
      this.height,
      this.signMap.map((row) => [...row]),
    )
    board.currentVertex = this.currentVertex
    return board
  }

  makeMove(sign, vertex) {
    let [x, y] = vertex
    // Out-of-bounds: treat as no-op
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return this.clone()
    }
    // Cannot place on occupied square
    if (this.signMap[y][x] !== 0) {
      return this.clone()
    }
    let board = this.clone()
    board.signMap[y][x] = sign
    return board
  }

  analyzeMove(sign, vertex) {
    let [x, y] = vertex

    // Out-of-bounds
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return {pass: false, overwrite: false, capturing: false, suicide: false}
    }

    let overwrite = this.signMap[y][x] !== 0

    return {
      pass: false,
      overwrite,
      capturing: false,
      suicide: false,
    }
  }

  getCaptures() {
    return 0
  }

  setCaptures() {
    // No-op for Gomoku
  }

  getStarPoints() {
    // Return star points for visual hoshi dots on the board
    let result = []
    let nearX = this.width >= 13 ? 3 : this.width >= 7 ? 2 : 0
    let nearY = this.height >= 13 ? 3 : this.height >= 7 ? 2 : 0
    let farX = this.width - nearX - 1
    let farY = this.height - nearY - 1

    let middleX = (this.width - 1) / 2
    let middleY = (this.height - 1) / 2

    if (
      nearX < 0 || nearY < 0 ||
      farX >= this.width || farY >= this.height ||
      nearX > farX || nearY > farY
    ) {
      return []
    }

    let points = [
      [nearX, nearY], [farX, nearY],
      [nearX, farY], [farX, farY],
    ]

    if (this.width % 2 !== 0 && this.height % 2 !== 0) {
      points.push(
        [middleX, nearY], [nearX, middleY],
        [farX, middleY], [middleX, farY],
        [middleX, middleY],
      )
    }

    return points
  }

  // Keep for API compatibility (used by board rendering)
  getHandicapPlacement(count) {
    return this.getStarPoints().slice(0, count)
  }

  getChain(vertex) {
    let sign = this.get(vertex)
    if (sign === 0) return [vertex]

    let visited = {}
    let chain = []
    let queue = [vertex]

    while (queue.length > 0) {
      let v = queue.pop()
      let key = v.join(',')
      if (visited[key]) continue
      visited[key] = true

      if (this.get(v) !== sign) continue
      chain.push(v)

      let [x, y] = v
      for (let [nx, ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
        if (this.has([nx, ny]) && !visited[[nx,ny].join(',')]) {
          queue.push([nx, ny])
        }
      }
    }

    return chain
  }

  getRelatedChains(vertex) {
    return this.getChain(vertex)
  }

  parseVertex(coord) {
    if (typeof coord !== 'string' || coord.length < 2) return [-1, -1]
    let x = alpha.indexOf(coord[0].toUpperCase())
    let y = this.height - parseInt(coord.slice(1), 10)
    if (isNaN(y) || x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return [-1, -1]
    }
    return [x, y]
  }

  stringifyVertex(vertex) {
    let [x, y] = vertex
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return ''
    return alpha[x] + (this.height - y)
  }

  checkWin(vertex) {
    if (!this.has(vertex)) return null
    let [vx, vy] = vertex
    let sign = this.signMap[vy][vx]
    if (sign === 0) return null

    // Check 4 directions: horizontal, vertical, diagonal-down, diagonal-up
    let directions = [
      [1, 0],  // horizontal
      [0, 1],  // vertical
      [1, 1],  // diagonal down-right
      [1, -1], // diagonal up-right
    ]

    for (let [dx, dy] of directions) {
      let line = [vertex]

      // Count in positive direction
      for (let i = 1; i < 5; i++) {
        let nx = vx + dx * i
        let ny = vy + dy * i
        if (!this.has([nx, ny]) || this.signMap[ny][nx] !== sign) break
        line.push([nx, ny])
      }

      // Count in negative direction
      for (let i = 1; i < 5; i++) {
        let nx = vx - dx * i
        let ny = vy - dy * i
        if (!this.has([nx, ny]) || this.signMap[ny][nx] !== sign) break
        line.push([nx, ny])
      }

      if (line.length === 5) {
        return {winner: sign, line}
      }
    }

    return null
  }
}

export function fromDimensions(width, height) {
  return new GomokuBoard(width, height)
}

export default GomokuBoard

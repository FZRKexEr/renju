# Renju

A beautiful Gomoku (Five in a Row / 五子棋) board and SGF editor, built with Electron and Preact.

Based on [Sabaki](https://github.com/SabakiHQ/Sabaki), an elegant Go board editor.

## Features

- Default 15x15 board, configurable from 5 to 25
- Win detection: exactly 5 stones in a row wins
- Fuzzy stone placement
- Read and save SGF games (GM[4]) and collections
- Open wBaduk NGF and Tygem GIB files
- Display formatted SGF comments using Markdown
- Personalize board appearance with textures & themes
- SGF editing tools, including lines & arrows board markup
- Copy & paste variations
- Powerful undo/redo
- Fast game tree
- Find move by move position and comment text
- Guess mode
- Autoplay games

![Screenshot](screenshot.png)

## Building & Development

```bash
npm install          # Install dependencies
npm run watch        # Watch and bundle files
npm start            # Start in development mode
npm run bundle       # Bundle for production
npm run test         # Run tests
```

For platform-specific builds:

```bash
npm run dist:macos   # macOS installer
npm run dist:linux   # Linux installer
npm run dist:win64   # Windows 64-bit installer
```

## License

This project is licensed under the [MIT license](LICENSE.md).

## Acknowledgments

Renju is based on [Sabaki](https://github.com/SabakiHQ/Sabaki) by Yichuan Shen.

## Related

- [Shudan](https://github.com/SabakiHQ/Shudan) - A highly customizable,
  low-level Preact Goban component.
- [immutable-gametree](https://github.com/SabakiHQ/immutable-gametree) - An
  immutable game tree data type.
- [sgf](https://github.com/SabakiHQ/sgf) - A library for parsing and creating
  SGF files.

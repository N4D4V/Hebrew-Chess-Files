# Hebrew Chess Files Extension

A Chrome extension that replaces chess file letters (a-h) with Hebrew letters (א-ח) on chess.com.

## Features

- **Automatic replacement**: Converts English chess file letters to Hebrew equivalents
- **Zero permissions**: No special browser permissions required

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `dist` folder
5. Navigate to chess.com and enjoy Hebrew chess coordinates!

## Letter Mapping

| English | Hebrew |
|---------|--------|
| a       | א      |
| b       | ב      |
| c       | ג      |
| d       | ד      |
| e       | ה      |
| f       | ו      |
| g       | ז      |
| h       | ח      |

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Target Site**: chess.com (all pages)
- **Runtime**: Content script with mutation observer
- **Performance**: Debounced processing with smart change detection

## Development

### Project Structure
```
hebrew-chess-files/
├── manifest.json       # Extension configuration
├── content.js          # Main extension logic
├── icons/              # Extension icons
├── README.md           # This file
└── LICENSE             # License file
```

### Building
Run `npm install` and then `npm run build` to generate the production files in the `dist` folder.

### Testing
1. Load the extension in development mode
2. Navigate to chess.com
3. Verify that chess file letters appear in Hebrew
4. Test with different game modes (live, analysis, puzzles).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Changelog

### v1.1.0
- Initial release
- Added feature to hide player names and rating
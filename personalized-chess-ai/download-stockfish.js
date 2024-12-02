const https = require('https');
const fs = require('fs');
const path = require('path');

const files = [
    {
        url: 'https://raw.githubusercontent.com/lichess-org/stockfish.js/master/stockfish.js',
        filename: 'stockfish.js'
    },
    {
        url: 'https://raw.githubusercontent.com/lichess-org/stockfish.js/master/stockfish.wasm',
        filename: 'stockfish.wasm'
    }
];

const targetDir = path.join(__dirname, 'public', 'stockfish');

// Create directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

files.forEach(file => {
    const filePath = path.join(targetDir, file.filename);
    const fileStream = fs.createWriteStream(filePath);

    https.get(file.url, response => {
        response.pipe(fileStream);
        fileStream.on('finish', () => {
            fileStream.close();
            console.log(`Downloaded ${file.filename}`);
        });
    }).on('error', err => {
        fs.unlink(filePath);
        console.error(`Error downloading ${file.filename}:`, err.message);
    });
});

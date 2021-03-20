const stream = require('stream');
const http = require('http');
const fs = require('fs');

console.log('Listening')

let i = 0;

// HTTP Server
const server = http.createServer((req, res) => {

    let chunks = [];

    // Data for each request comes in as a stream, every chunk that arrives triggers this callback
    req.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk, 'binary'));
    });

    // When all chunks have been processed, save to test-0.webm, test-1.webm, etc.
    req.on('end', () => {
        if (req.method == 'POST') {
            try {
                let binaryContent = Buffer.concat(chunks);
                const fileStream = fs.createWriteStream(`test-${i}.webm`, { flags: 'w' });
                fileStream.write(binaryContent);
                console.log('wrote file');
                i++;

            } catch (err) {
                console.log(err);
            }   
        } 
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.writeHead(200);
    res.end(JSON.stringify({msg: 'hello world'}));
});

server.listen(1337);
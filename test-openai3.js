const https = require('https');

const data = JSON.stringify({
  model: "dall-e-3",
  prompt: "A futuristic city",
  n: 1,
  size: "invalid"
});

const req = https.request('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-fakekey' // using fake key to see if size error appears first
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log(`Status:`, res.statusCode);
    console.log(`Body:`, body);
  });
});

req.write(data);
req.end();

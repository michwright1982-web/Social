const https = require('https');

const data = JSON.stringify({
  model: "dall-e-3",
  prompt: "test",
  n: 1,
  size: "1024x1792"
});

const req = https.request(`https://api.openai.com/v1/images/generations`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer INVALID_KEY'
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log(`OpenAI response:`, res.statusCode, body);
  });
});

req.write(data);
req.end();

const https = require('https');

function testEndpoint(method) {
  const data = JSON.stringify({
    instances: [{ prompt: "test" }],
    parameters: { sampleCount: 1 }
  });

  const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:${method}?key=INVALID_KEY`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      console.log(`${method} response:`, res.statusCode, body);
    });
  });

  req.write(data);
  req.end();
}

testEndpoint('predict');
testEndpoint('generateImages');

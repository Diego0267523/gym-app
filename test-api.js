const http = require('http');

const options = {
  hostname: 'localhost',
  port: 9090,
  path: '/api/posts?page=1',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        console.log('✅ Success:', {
          success: json.success,
          posts_count: json.posts?.length || 0,
          query_time: json.queryTimeMs + 'ms'
        });
      } catch (e) {
        console.log('Response:', data.slice(0, 200));
      }
    } else {
      console.log('Error response:', data.slice(0, 300));
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();

const http = require('http');

console.log('Haciendo request a /api/posts...');

const options = {
  hostname: 'localhost',
  port: 9090,
  path: '/api/posts?page=1',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
};

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.success) {
        console.log('✅ Posts obtenidos:');
        console.log(`   - Total posts: ${json.posts?.length || 0}`);
        console.log(`   - Query time: ${json.queryTimeMs}ms`);
        if (json.posts?.length > 0) {
          console.log(`   - Primer post: "${json.posts[0].caption?.slice(0, 50)}..."`);
        }
      } else {
        console.log('❌ Error:', json.message);
      }
    } catch (e) {
      console.log('❌ Parse error:', e.message);
      console.log('Response:', data.slice(0, 300));
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Request timeout (10s)');
  req.abort();
  process.exit(1);
});

req.end();

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = true;
const hostname = 'localhost';
const port = 3000;

console.log('🚀 Starting Vanity Hub development server...');

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log('✅ Next.js app prepared successfully');
  
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('❌ Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  }).listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Failed to start server:', err);
      throw err;
    }
    console.log(`🎉 Server ready on http://${hostname}:${port}`);
    console.log(`📱 Admin login: admin@vanityhub.com / admin123`);
    console.log(`🔧 API test: http://${hostname}:${port}/api/services`);
  });
}).catch((ex) => {
  console.error('❌ Failed to prepare Next.js app:', ex);
  process.exit(1);
});

// Custom Next.js server
const { createServer } = require('http');
const { parse } = require('url');
const net = require('net');
const os = require('os');

// Import Next.js directly
let next;
try {
  next = require('next');
} catch (error) {
  console.error('Failed to load Next.js module:', error.message);
  console.error('Please ensure Next.js is installed correctly.');
  process.exit(1);
}

// Determine if we're in development mode
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';

// Use a different port to avoid conflicts
let port = parseInt(process.env.PORT || '3000', 10);

// Check if port is specified in command line arguments
const args = process.argv.slice(2);
console.log('Command line arguments:', args);

// Check for -p or --port flag
const portArgIndex = args.findIndex(arg => arg === '-p' || arg === '--port');
if (portArgIndex !== -1 && args.length > portArgIndex + 1) {
  const portArg = parseInt(args[portArgIndex + 1], 10);
  if (!isNaN(portArg)) {
    port = portArg;
    console.log(`Using port from command line arguments: ${port}`);
  }
}

// Also check for direct port number as first argument
if (args.length > 0 && !isNaN(parseInt(args[0], 10))) {
  port = parseInt(args[0], 10);
  console.log(`Using port from first command line argument: ${port}`);
}

// Check for port number as second argument (after host)
if (args.length > 1 && !isNaN(parseInt(args[1], 10))) {
  port = parseInt(args[1], 10);
  console.log(`Using port from second command line argument: ${port}`);
}

console.log(`Attempting to start server on port ${port}`);

// Function to check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
}

// Function to find an available port
async function findAvailablePort(startPort) {
  let currentPort = startPort;
  const maxPort = startPort + 100; // Try up to 100 ports

  while (currentPort < maxPort) {
    if (!(await isPortInUse(currentPort))) {
      return currentPort;
    }
    currentPort++;
  }

  throw new Error('Could not find an available port');
}

// Main function to start the server
async function startServer() {
  try {
    // Check if the specified port is available
    if (await isPortInUse(port)) {
      console.log(`Port ${port} is already in use. Trying to find an available port...`);
      port = await findAvailablePort(port + 1);
      console.log(`Found available port: ${port}`);
    }

    // Initialize Next.js with the available port
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();

    // Prepare the server
    await app.prepare();

    // Create the HTTP server
    const server = createServer((req, res) => {
      // Parse the URL
      const parsedUrl = parse(req.url, true);

      // Let Next.js handle the request
      handle(req, res, parsedUrl);
    });

    // Add error handling
    server.on('error', (err) => {
      console.error('Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please try again with a different port.`);
        process.exit(1);
      }
    });

    // Start listening
    server.listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Local URL: http://localhost:${port}`);

      // Try to get network interfaces safely
      try {
        const networkInterfaces = require('os').networkInterfaces();
        const wifiInterface = networkInterfaces['Wi-Fi'] || networkInterfaces['Ethernet'] || [];
        const ipv4Interface = wifiInterface.find(iface => iface.family === 'IPv4');
        const networkAddress = ipv4Interface ? ipv4Interface.address : '0.0.0.0';
        console.log(`> Network URL: http://${networkAddress}:${port}`);
      } catch (error) {
        console.log(`> Network URL: http://[Your IP Address]:${port}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { createServer as createNetServer } from 'net';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const preferredPort = parseInt(process.env.PORT || '3000', 10);
const hostname = 'localhost';

async function findAvailablePort(host: string, startPort: number, maxAttempts = 20): Promise<number> {
  let attempt = 0;
  let portToTry = startPort;

  while (attempt <= maxAttempts) {
    // eslint-disable-next-line no-await-in-loop
    const isFree = await new Promise<boolean>((resolve) => {
      const tester = createNetServer();
      tester.once('error', () => resolve(false));
      tester.once('listening', () => tester.close(() => resolve(true)));
      try {
        tester.listen(portToTry, host);
      } catch {
        resolve(false);
      }
    });

    if (isFree) return portToTry;

    attempt += 1;
    portToTry += 1;
  }

  // Fallback to an ephemeral port assigned by the OS
  return new Promise<number>((resolve, reject) => {
    const tester = createNetServer();
    tester.once('error', (err) => reject(err));
    tester.once('listening', () => {
      const addressInfo = tester.address();
      tester.close(() => {
        if (addressInfo && typeof addressInfo === 'object') {
          resolve(addressInfo.port);
        } else {
          reject(new Error('Unable to determine ephemeral port'));
        }
      });
    });
    tester.listen(0, host);
  });
}

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    console.log('Starting custom server...');
    
    // Create Next.js app
    const selectedPort = await findAvailablePort(hostname, preferredPort);
    if (selectedPort !== preferredPort) {
      console.warn(`Port ${preferredPort} in use. Falling back to available port ${selectedPort}.`);
    }

    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      hostname,
      port: selectedPort
    });

    console.log('Preparing Next.js app...');
    await nextApp.prepare();
    console.log('Next.js app prepared successfully');
    
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer(async (req, res) => {
      try {
        // Let Next.js handle all requests
        await handle(req, res);
      } catch (err) {
        console.error('Request handling error:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

    // Make socket.io available to API routes
    (global as any).io = io;

    // Handle server errors
    server.on('error', (err) => {
      console.error('Server error:', err);
    });

    // Start the server
    server.listen(selectedPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${selectedPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${selectedPort}/api/socketio`);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();

import app from './app.js';
import connectDB from './config/db.js';
import { createServer } from 'node:http';
import { initializeSocket } from './socket.js';

const PORT = process.env.PORT || 5000;
const server = createServer(app);

// Connect to Database
connectDB().then(() => {
  initializeSocket(server);
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});

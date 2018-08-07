/**
 * Module dependencies.
 */
import app from './app';
import http from 'http';

import { config } from "../config";
import { normalizePort } from "./utils/server-utils";
import { SocketManager } from "./socket";

/**
 * Get port from config and set in Express.
 */
const port = normalizePort( config.port );
app.set( 'port', port );
app.set( 'env', process.env.NODE_ENV );

/**
 * Create HTTP server.
 */
const server = http.createServer( app );
const socketManager = SocketManager.getManager();
socketManager.initialize( server );

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(
  ...[ port, config.ip ].filter(v => !!v)
);

server.on( 'error', onError );
server.on( 'listening', onListening );

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch ( error.code ) {
    case 'EACCES':
      console.error( bind + ' requires elevated privileges' );
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error( bind + ' is already in use' );
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;

  console.log(
    `Listening on ${bind} [in ${process.env.NODE_ENV || 'development (default)'} mode].`
  );
}
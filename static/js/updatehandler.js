import { io } from 'socket.io-client';

import { updatePlayer } from './main';

// Connect to the Flask-SocketIO server
const socket = io('http://localhost:5000'); // Replace with your server URL if needed

// Send a message to the server
socket.emit('message', 'Hello from JavaScript!');

// Listen for messages from the server
socket.on('update_player', (data) => {
    updatePlayer(data);
});

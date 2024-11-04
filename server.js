const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

let onlineUsers = {}; 

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('setNickname', (nickname) => {
        if (nickname) {
            socket.username = nickname;
            onlineUsers[socket.id] = nickname;
            console.log(`User ${nickname} connected`);
            io.emit('updateUserList', onlineUsers); 
            io.emit('userConnected', nickname); 
        }
    });

    socket.on('chatMessage', (msg) => {
        if (socket.username) {
            socket.broadcast.emit('message', { username: socket.username, msg });
        }
    });

    socket.on('typing', () => {
        if (socket.username) {
            socket.broadcast.emit('typing', `${socket.username} is typing...`);
        }
    });

    socket.on('stopTyping', () => {
        socket.broadcast.emit('stopTyping');
    });

    socket.on('privateMessage', ({ recipientId, message }) => {
        const recipientSocket = io.sockets.sockets.get(recipientId);
        if (recipientSocket) {
            recipientSocket.emit('privateMessage', { sender: socket.username, message });
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            console.log(`User ${socket.username} disconnected`);
            delete onlineUsers[socket.id];
            io.emit('updateUserList', onlineUsers); 
            io.emit('userDisconnected', socket.username); 
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

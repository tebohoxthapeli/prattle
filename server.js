const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const socketio = require('socket.io');
const io = socketio(server);

const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const botName = 'Prattler';
const PORT = 3000 || process.env.PORT;

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// run when client connects
io.on('connection', socket => {

    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // welcome current user
        socket.emit('message', formatMessage(botName, `Joined room: ${user.room}`));

        // broadcast when user connects (to all users exc the one connecting)
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        // send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // listen for chatMessage
    socket.on('chatMessage', msg => {

        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
    
    // runs when client disconnects
    socket.on('disconnect', () => {

        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            // send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }  
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const socketio = require('socket.io');
const io = socketio(server);

const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const botName = 'Prattler (This is a bot)';
const PORT = 3000 || process.env.PORT;

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// run when client connects
io.on('connection', socket => {
    let count = 0;

    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);

        // join a room
        socket.join(user.room);

        // welcome current user
        socket.emit('message', formatMessage(botName, `Joined room: ${user.room}`), 'admin');

        // broadcast when user connects (to all users exc the one connecting)
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`), 'admin');

        // send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        count++;
        const msgID = `${user.id}` + `${count}`;

        socket.emit('message', formatMessage('Me', msg), 'sent', msgID);
        socket.broadcast.to(user.room).emit('message', formatMessage(user.username, msg), 'received', msgID);
    });

    // listen for deletion
    socket.on('deleteMessage', msgID => {
        const user = getCurrentUser(socket.id);

        if (user) {
            io.to(user.room).emit('delete', { 
                user: user.username,
                id: msgID
             });
        }
    });
    
    // runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            // io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`), 'admin');

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
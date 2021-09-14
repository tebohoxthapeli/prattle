if (process.env.NODE_ENV !== 'production') {
    const dotenv = require('dotenv')
    const dotenvParseVariables = require('dotenv-parse-variables')

    let env = dotenv.config({})
    if (env.error) throw env.error
    env = dotenvParseVariables(env.parsed)
 
}

const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

const socketio = require('socket.io');
const io = socketio(server);

const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const botName = 'Prattler (This is a bot)';
const PORT = 3000 || process.env.PORT;

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

app.get('/chat', (req, res) => {
    const { username, room } = req.query;
    const users = getRoomUsers(room);

    const foundDuplicate = users.find(user => user.username === username);

    if (foundDuplicate) {
        res.status(400).send('<h3>Error: A user with the same username already exists in the room you are trying to enter. Please try a new username. </h3>');
        return;
    }

    if (!(username || room)) {
        res.status(400).send('<h3>Error: Enter a username and select a room before attempting to join a chat. </h3>');
        return;
    }
    
    res.sendFile(path.resolve(__dirname, './public/chat.html'));
});

// run when client connects
io.on('connection', socket => {
    let count = 0;
    const id = socket.id;

    socket.on('joinRoom', ({ username, room }) => {
        // join a room
        socket.join(room);

        // add user to list of users in the room
        userJoin(id, username, room);

        // welcome current user
        socket.emit('message', {
            msg: formatMessage(botName, `Joined room: ${room}`),
            sendStatus: 'admin',
            msgID: ''
        });

        // broadcast when user connects (to all users except the one connecting)
        socket.broadcast.to(room).emit('message', {
            msg: formatMessage(botName, `${username} has joined the chat`),
            sendStatus: 'admin',
            msgID: ''
        });

        // send room info
        socket.emit('roomInfo', room);

        // send users info to all users
        io.to(room).emit('roomUsers', getRoomUsers(room));
    });

    // listen for chatMessage
    socket.on('chatMessage', msg => {
        count++;
        const user = getCurrentUser(id);
        const msgID = `${id}` + `${count}`;

        socket.emit('message', {
            msg: formatMessage('Me', msg),
            sendStatus: 'sent',
            msgID
        });

        socket.broadcast.to(user.room).emit('message', {
            msg: formatMessage(user.username, msg),
            sendStatus: 'received',
            msgID
        });
    });

    // listen for deletion
    socket.on('deleteMessage', msgID => {
        const user = getCurrentUser(id);

        io.to(user.room).emit('delete', { 
            user: user.username,
            msgID
        });  
    });
    
    // runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(id);

        if (user) {
            socket.broadcast.to(user.room).emit('message', {
                msg: formatMessage(botName, `${user.username} has left the chat`),
                sendStatus: 'admin',
                msgID: ''
            });

            // update users info
            io.to(user.room).emit('roomUsers', getRoomUsers(user.room));
        }  
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
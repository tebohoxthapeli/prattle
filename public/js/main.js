const socket = io();
const chatMessages = document.querySelector('.chat-messages');
const chatForm = document.getElementById('chat-form');

const roomName = document.querySelector('#room-name');
const userList = document.querySelector('#users');

// get username and room from URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

//get text input
const textInput = document.querySelector('#msg');
textInput.focus();

// join chatroom
socket.emit('joinRoom', { username, room });

// get room and Users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});

// message from server
socket.on('message', (message, sendStatus) => {
    outputMessage(message, sendStatus);

    // scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// message submits
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // get text input value
    const msg = textInput.value;
    
    // emit the message to the server
    socket.emit('chatMessage', msg);

    // clear input
    textInput.value = '';

    textInput.focus();
});

// output message to DOM
function outputMessage(message, sendStatus) {
    let bg;
    let nameColor = 'other-name';
    let timeColor = 'other-time';

    if (sendStatus === 'sent') {
        bg = 'sent-bg';
        nameColor = 'sent-name';
        timeColor = 'sent-time';
    }
    else if (sendStatus === 'received') {
        bg = 'received-bg';
    }
    else {
        bg = 'admin-bg';
    }

    const div = document.createElement('div');
    div.classList.add('message', `${bg}`);
    div.innerHTML = `<p class="meta ${nameColor}">${message.username} <span class=${timeColor}>${message.time}</span> </p>
    <p class="text">${message.text}</p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

// add room to DOM
function outputRoomName (room) {
    roomName.innerText = room;
}

// add users to DOM
function outputUsers (users) {
    users.forEach(user => {
        if(user.username === username) {
            user.username += ' (Me)';
        }
    });
    userList.innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}
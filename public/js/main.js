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

// get room
socket.on('roomInfo', room => {
    outputRoomName(room);
});

// get users
socket.on('roomUsers', users => {
    outputUsers(users);
});

// message from server
socket.on('message', ({ msg, sendStatus, msgID }) => {
    outputMessage(msg, sendStatus, msgID);

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
function outputMessage(message, sendStatus, msgID) {
    let bg, nameColor;
    let sent = false;
    let timeColor = 'other-time';

    const textParagraph = document.createElement('p');
    textParagraph.innerHTML = message.text;
    textParagraph.classList.add('text');

    const div = document.createElement('div');

    if (msgID) {
        div.setAttribute('id', msgID);
    }
    
    switch (sendStatus) {
        case 'sent': {
            sent = true;
            bg = 'sent-bg';
            nameColor = 'sent-name';
            break;
        }
        case 'received': {
            bg = 'received-bg';
            nameColor = 'received-name';
            break;
        }
        default: {
            bg = 'admin-bg';
            nameColor = 'admin-color';
            timeColor = 'admin-color';
            textParagraph.classList.remove('text');
            textParagraph.classList.add('admin-font-style', 'admin-color');
        }
    }

    
    div.classList.add('message', `${bg}`);
    div.innerHTML = `<p class="meta ${nameColor} ${(sendStatus === 'admin') ? 'admin-font-style' : ''}">${message.username} | <span class="${timeColor}">${message.time}</span></p>`;
    div.appendChild(textParagraph);
    
    if (sent) {
        const deleteBtn = getDeleteBtn();
        div.appendChild(deleteBtn);
        addDeleteEvent(deleteBtn, msgID);
    }
    document.querySelector('.chat-messages').appendChild(div);
}

// create a delete button
function getDeleteBtn () {
    const btn = document.createElement('button');
    const icon = document.createElement('i');
    icon.classList.add('fas', 'fa-trash-alt');
    btn.appendChild(icon);
    return btn;
}

function addDeleteEvent (deleteBtn, msgID) {
    deleteBtn.addEventListener('click', () => {
        socket.emit('deleteMessage', msgID);
    })
}

// delete the message
socket.on('delete', ({ user, msgID }) => {
    const message = document.getElementById(msgID);

    if (user === username) {
        chatMessages.removeChild(message);
    }
    else {
        const textParagraph = message.lastChild;
        textParagraph.innerHTML = 'This message has been deleted by its author';
        textParagraph.classList.remove('text');
        textParagraph.classList.add('admin-font-style', 'admin-color');
    }
});

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
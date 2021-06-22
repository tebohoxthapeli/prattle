const socket = io();
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.querySelector('#room-name');
const userList = document.querySelector('#users');

// get username and room from URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

//get text input
const textInput = document.querySelector('#msg');

textInput.focus();
console.log(username, room);

// join chatroom
socket.emit('joinRoom', { username, room });

// get room and Users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});

// message from server
socket.on('message', message => {
    console.log(message);
    outputMessage(message);

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
function outputMessage(message){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span> </p>
    <p class="text">${message.text}</p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

// add room to DOM
function outputRoomName (room) {
    roomName.innerText = room;
}

// add users to DOM
function outputUsers (users) {
    userList.innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}
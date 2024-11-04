const socket = io();
let nickname = '';
let onlineUsers = {}; 

function setNickname() {
    nickname = document.getElementById('nickname').value;
    if (nickname) {
        socket.emit('setNickname', nickname);
        document.getElementById('nicknameContainer').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'flex';
        document.getElementById('nicknameDisplay').textContent = `Logged in as: ${nickname}`; 
    }
}

function sendMessage() {
    const messageInput = document.getElementById('message');
    const message = messageInput.value;
    if (message) {
        addMessage(`You: ${message}`); 
        socket.emit('chatMessage', message); 
        messageInput.value = ''; 
        stopTyping(); 
    }
}

function leaveChat() {
    socket.emit('leaveChat'); 
    resetChat(); 
}

function resetChat() {
    nickname = ''; 
    document.getElementById('nickname').value = ''; 
    document.getElementById('nicknameContainer').style.display = 'flex';
    document.getElementById('chatContainer').style.display = 'none';
    document.getElementById('messages').innerHTML = ''; 
    document.getElementById('typingIndicator').textContent = ''; 
    document.getElementById('nicknameDisplay').textContent = ''; 
}

function typing() {
    socket.emit('typing');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(stopTyping, 1000); 
}

function stopTyping() {
    socket.emit('stopTyping');
}

socket.on('message', ({ username, msg }) => {
    if (username) addMessage(`${username}: ${msg}`);
});

socket.on('userConnected', (username) => {
    if (username) addMessage(`${username} has joined the chat`);
});

socket.on('userDisconnected', (username) => {
    if (username) addMessage(`${username} has left the chat`);
});

socket.on('updateUserList', (updatedUsers) => {
    onlineUsers = updatedUsers; 
    updateUserList();
});

socket.on('typing', (msg) => {
    document.getElementById('typingIndicator').textContent = msg;
});

socket.on('stopTyping', () => {
    document.getElementById('typingIndicator').textContent = '';
});

socket.on('privateMessage', ({ sender, message }) => {
    if (sender) addMessage(`(Private) ${sender}: ${message}`);
});

function addMessage(msg) {
    const messageContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = msg;
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight; 
}

function updateUserList() {
    const userListContainer = document.getElementById('userList');
    userListContainer.innerHTML = '';
    Object.entries(onlineUsers).forEach(([id, username]) => {
        const userEntry = document.createElement('div');
        userEntry.classList.add('user-entry');

        const userNameSpan = document.createElement('span');
        userNameSpan.textContent = username;

        const messageButton = document.createElement('button');
        messageButton.textContent = 'Message';
        messageButton.onclick = () => initiatePrivateMessage(id, username);

        userEntry.appendChild(userNameSpan);
        userEntry.appendChild(messageButton);
        userListContainer.appendChild(userEntry);
    });
}

function initiatePrivateMessage(recipientId, username) {
    const message = prompt(`Enter a private message for ${username}:`);
    if (message) {
        socket.emit('privateMessage', { recipientId, message });
        addMessage(`(Private to ${username}): ${message}`);
    }
}

document.getElementById('nickname').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        setNickname();
    }
});

document.getElementById('message').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
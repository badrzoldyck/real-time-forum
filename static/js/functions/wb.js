const chatdiv = `<h2>Chat App</h2>
    <div id="chat"></div>
    <input type="text" id="messageInput" placeholder="Type a message">
    <button id="sendmsg">Send</button>
    <div><h3>Online Users</h3>
    <ul id="user-list"></ul></div>`

    const alldiv = document.getElementById("chatapp")
    alldiv.innerHTML = chatdiv

    const load = document.getElementById("chat")


let socket;
let userId = "";
let selectedUser = "";
let num = 0;
let messages = [];

document.getElementById("sendmsg").addEventListener("click",() =>{
    sendMessage()
})
load.addEventListener("scroll",() =>{
    num += 10
    loadMessages()
})


export function connect(id) {
    userId = id;
    socket = new WebSocket(`ws://${document.location.host}/ws?id=${userId}`);

    socket.onopen = () => {
        console.log("Connected!");
    }



    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "userList") {
            updateUserList(data.users);
        } else {
            loadMessages()
           
            document.getElementById(data.sender).textContent = data.sender + "    New Message"
        }
    };
    socket.onclose = () => console.log("Disconnected!");
}


function updateUserList(users) {
    const userList = document.getElementById("user-list");
    users = users.filter((x) => x != userId);
    console.log(userId + " " + users);
    
    userList.innerHTML = "";
    users.forEach(user => {
        let li = document.createElement("li");
        li.textContent = user;
        li.onclick = () => startChat(user);
        li.id = user
        userList.appendChild(li);
        console.log(user + " is Connected");
    });
}

function displayMessage(msg, type) {
    let chat = document.getElementById("chat");
    let div = document.createElement("div");
    div.classList.add("message", type);
    div.innerHTML = `<strong>${msg.sender}:</strong> ${msg.text} <br><small>${new Date(msg.timestamp).toLocaleTimeString()}</small>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function loadMessages() {

    if (!selectedUser) return;

    fetch(`/messages?sender=${userId}&receiver=${selectedUser}&num=${num}`)
        .then(res => res.json())
        .then(data => {
            if (data == null){
                return
            }
            messages.push(...data)
            messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            
            let chat = document.getElementById("chat");
            chat.innerHTML = "";
            messages.forEach(msg => displayMessage(msg, msg.sender === userId ? "sent" : "received"));
        });
}


function startChat(receiver) {
    document.getElementById(receiver).textContent = receiver
    selectedUser = receiver;
    if (messages.length == 0){
        loadMessages();
    }else{
        messages = []
        loadMessages();
    }
}

function sendMessage() {
    let text = document.getElementById("messageInput").value;
    if (!selectedUser || !text) return;

    let msg = { sender: userId, receiver: selectedUser, text: text, timestamp: new Date().toISOString() };
    socket.send(JSON.stringify(msg));
    displayMessage(msg, "sent");

    document.getElementById("messageInput").value = "";
}

//exports = connect
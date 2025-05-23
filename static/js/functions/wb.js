import {loginPage, loginHundler } from './login.js'

const chatdiv = `<h2>Chat App</h2>
    <button id="close" style="display: none;">close</button>
    <div id="chat" style="display: none;"></div>
    <input type="text" id="messageInput" placeholder="Type a message">
    <button id="sendmsg">Send</button>
    <div><h3>Users</h3>
    <ul id="user-list" class="user-list"></ul></div>`

    const alldiv = document.getElementById("chatapp")
    alldiv.innerHTML = chatdiv


let socket;
let userId = "";
let selectedUser = "";
let usersOnline = [];
let allUsers = [];
let num = 0;
let istyping = false;
let istyping1 = false;
const load = document.getElementById("chat");
const inputText = document.getElementById("messageInput")

const close = document.getElementById("close");
close.addEventListener("click",()=>{
    load.style.display = "none"
   close.style.display = "none"
})
document.getElementById("sendmsg").addEventListener("click",() =>{
    sendMessage()
})

let isFetching = false;


load.addEventListener("scrollend", () => {
    if (isFetching) return;


    num+=10
    loadMessages(num)
    isFetching = true;
});



export function connect(id) {
    
    userId = id;
    socket = new WebSocket(`ws://${document.location.host}/ws?id=${userId}`);

    socket.onopen = () => {
        console.log("Connected!");
    }



    socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        

        if (data.type === "userList") {
            await fetchUserName();
            usersOnline = data.users
            updateUserList()

        }else if (data.type === "typing"){
            
            if (!istyping && data.text === "typing"){
                document.getElementById(data.users).innerHTML += `<p id="typing" style="white-space: pre;"></p>`;
                document.getElementById("typing").textContent = "  Typing...   "
                istyping , istyping1 = true;
            }else if (istyping && data.text === "typing"){
                document.getElementById("typing").textContent = "  Typing...   "
                istyping1 = true;
            }else if (data.text === "noTyping"){
                document.getElementById("typing").textContent = "";
                istyping1 = false;
            }      
        } else{
            await fetchUserName()
            if(data.sender == selectedUser){
                displayMessage(data, data.sender === userId ? "sent" : "received",true);
            }
            document.getElementById(data.sender).innerHTML +=  `<span class="new-msg-badge">  New</span>`
            document.getElementById(data.sender).className = "online"
        }
    };
    socket.onclose = () => {
        //console.log("Disconnected!");
    }
}


function showAllUsers(){
    if(allUsers.length == 0){
        return
    }
    const userList = document.getElementById("user-list");
    userList.innerHTML = "";
    allUsers.forEach(user => {
        let li = document.createElement("li");
        li.textContent = user;
        li.onclick = () => startChat(user);
        li.id = user
        userList.appendChild(li);
    });
    if (istyping1 && document.querySelectorAll("#typing").length != 0){
            document.getElementById("typing").textContent = "  Typing...   "
    }
}

function updateUserList() {
    if(usersOnline.length == 0){
        return
    }
    usersOnline = usersOnline.filter((x) => x != userId);
    showAllUsers()
    usersOnline.forEach(user => {
        let li = document.getElementById(user)
        li.className = "online";
        console.log(user + " is Connected");
    });
    if (istyping1  && document.querySelectorAll("#typing").length != 0){
        document.getElementById("typing").textContent = "  Typing...   "
    }
}

function displayMessage(msg, type,isadd = false) {
    let chat = document.getElementById("chat");
    let div = document.createElement("div");
    div.classList.add("message", type);
    div.innerHTML = `<strong>${msg.sender}:</strong> ${msg.text} <br><small>${new Date(msg.timestamp).toLocaleTimeString()}</small>`;
    if (!isadd){
        chat.appendChild(div);
    }else{
        chat.prepend(div);
    }
   // chat.scrollTop = chat.scrollHeight;
}

function loadMessages(num = 0) {

    if (!selectedUser) {
        isFetching = false
        return
    };

    fetch(`/messages?sender=${userId}&receiver=${selectedUser}&num=${num}`)
        .then(res => res.json())
        .then(data => {
            if (data == null){
                isFetching = false
                return
            }
           data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            
            //let chat = document.getElementById("chat");
            data.reverse().forEach(msg => displayMessage(msg, msg.sender === userId ? "sent" : "received"));
            isFetching = false
        });
}


function startChat(receiver) {
    document.getElementById("chat").innerHTML = "";
    load.style.display = "flex"
    close.style.display = "block"
    selectedUser = receiver;
    if (document.querySelectorAll("#typing").length != 0){
        document.getElementById(receiver).textContent = receiver
        document.getElementById(receiver).innerHTML += `<p id="typing" style="white-space: pre;"></p>`;
        document.getElementById("typing").textContent = "  Typing...   "
    }else{
        document.getElementById(receiver).textContent = receiver
    }
    loadMessages();
}

async function sendMessage() {
    let text = inputText.value;
    if (!selectedUser || !text) return;

    let msg = {type: "message", sender: userId, receiver: selectedUser, text: text, timestamp: new Date().toISOString() };
    socket.send(JSON.stringify(msg));
    displayMessage(msg, "sent",true);
    inputText.value = "";
    await fetchUserName()
    updateUserList()
}




export async function fetchUserName(user = userId){
    const response = await fetch(`/users?username=${user}`)
    const Json = await response.json()
    allUsers = Json;
    showAllUsers();

}



document.getElementById("logoutButton").addEventListener("click",async () =>{
    const response = await fetch("/logout")
    if (!response.ok){
        const Json = await response.json();
        alert(Json.message);
        
    }else{
        document.getElementById("container1").innerHTML = "";
        socket.close();
        loginPage()
        loginHundler()
        document.getElementById("homepage").style.display = "none"
    }
})


inputText.addEventListener("input", () =>{
    
    if (inputText.value.length != 0){
        let msg = {type: "typing",receiver: selectedUser,text:"typing"};
        socket.send(JSON.stringify(msg));
    }else{
        let msg = {type: "typing",receiver: selectedUser,text:"notyping"};
        socket.send(JSON.stringify(msg));
    }
})
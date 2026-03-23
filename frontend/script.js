const socket = io("http://localhost:3000");

const chat = document.getElementById("chat");
const msgInput = document.getElementById("message");
const usernameInput = document.getElementById("username");
const roomInput = document.getElementById("room");

let currentUser = "";
let currentRoom = "";
let typingTimer = null;
let typingLi = null;

/* ─── JOIN ROOM ─── */
function joinRoom() {
    const username = usernameInput.value.trim();
    const roomId = roomInput.value.trim();

    if (!username || !roomId) {
        shakeInput(!username ? usernameInput : roomInput);
        return;
    }

    currentUser = username;
    currentRoom = roomId;

    console.log("JOINING ROOM:", roomId);

    socket.emit("join_room", { username, roomId });

    chat.innerHTML = "";
    msgInput.focus();
}

/* ─── SEND MESSAGE ─── */
function sendMessage() {
    const msg = msgInput.value.trim();

    if (!currentRoom || !currentUser) {
        addSystemMessage("Join a room first!");
        return;
    }

    if (!msg) return;

    console.log("SENDING:", msg);

    socket.emit("send_message", msg);

    msgInput.value = "";

    socket.emit("typing_stop");
}

/* ─── CLEAR CHAT ─── */
function clearChat() {
    if (!currentRoom) {
        addSystemMessage("Join a room first!");
        return;
    }

    const confirmClear = confirm("Clear all messages in this room?");
    if (!confirmClear) return;

    console.log("CLEAR REQUEST FOR ROOM:", currentRoom);

    socket.emit("clear_chat");
}

/* ─── RECEIVE EVENTS ─── */
socket.on("receive_message", (msg) => {
    removeTypingIndicator();
    addMessage(msg);
    scrollToBottom();
});

socket.on("chat_history", (messages) => {
    chat.innerHTML = "";
    messages.forEach(addMessage);
    scrollToBottom();
});

socket.on("chat_cleared", () => {
    console.log("CHAT CLEARED RECEIVED");
    chat.innerHTML = "";
    addSystemMessage("Chat cleared 🧹");
});

/* ─── USER EVENTS ─── */
socket.on("user_joined", ({ username }) => {
    addSystemMessage(`${username} joined the room`);
});

socket.on("user_left", ({ username }) => {
    addSystemMessage(`${username} left the room`);
});

/* ─── TYPING EVENTS ─── */
socket.on("user_typing", ({ username }) => {
    if (username === currentUser) return;
    showTypingIndicator(username);
});

socket.on("user_stopped_typing", () => {
    removeTypingIndicator();
});

/* ─── ADD MESSAGE ─── */
function addMessage(msg) {
    const li = document.createElement("li");

    if (msg.sender === currentUser) {
        li.textContent = msg.text;
        li.classList.add("right");
    } else {
        const name = document.createElement("span");
        name.classList.add("sender-name");
        name.textContent = msg.sender;

        li.appendChild(name);
        li.appendChild(document.createTextNode(msg.text));
        li.classList.add("left");
    }

    chat.appendChild(li);
}

/* ─── SYSTEM MESSAGE ─── */
function addSystemMessage(text) {
    const li = document.createElement("li");
    li.textContent = text;
    li.classList.add("system");
    chat.appendChild(li);
    scrollToBottom();
}

/* ─── TYPING INDICATOR ─── */
function showTypingIndicator(username) {
    if (typingLi) return; // prevent duplicate

    typingLi = document.createElement("li");
    typingLi.classList.add("typing-indicator");

    typingLi.innerHTML = `
        <span></span><span></span><span></span>
    `;

    typingLi.title = `${username} is typing…`;

    chat.appendChild(typingLi);
    scrollToBottom();
}

function removeTypingIndicator() {
    if (typingLi) {
        typingLi.remove();
        typingLi = null;
    }
}

/* ─── KEYBOARD ─── */
msgInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

msgInput.addEventListener("input", () => {
    if (!currentRoom) return;

    socket.emit("typing_start");

    clearTimeout(typingTimer);

    typingTimer = setTimeout(() => {
        socket.emit("typing_stop");
    }, 1500);
});

usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") roomInput.focus();
});

roomInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") joinRoom();
});

/* ─── SCROLL ─── */
function scrollToBottom() {
    chat.scrollTo({
        top: chat.scrollHeight,
        behavior: "smooth"
    });
}

/* ─── THEME TOGGLE ─── */
function toggleTheme(el) {
    const doc = document.documentElement;
    const dark = doc.getAttribute("data-theme") === "dark";

    doc.setAttribute("data-theme", dark ? "light" : "dark");

    el.querySelector(".knob").textContent = dark ? "☀️" : "🌙";
}

/* ─── INPUT SHAKE ─── */
function shakeInput(input) {
    input.style.borderColor = "#ef4444";

    const shake = [
        { transform: "translateX(0)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(4px)" },
        { transform: "translateX(0)" }
    ];

    input.animate(shake, { duration: 350 });

    setTimeout(() => {
        input.style.borderColor = "";
    }, 1000);

    input.focus();
}
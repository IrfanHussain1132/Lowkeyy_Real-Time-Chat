const socket = io("http://localhost:3000");

const chat = document.getElementById("chat");
const msgInput = document.getElementById("message");
const usernameInput = document.getElementById("username");

let currentUser = "";

function scrollToBottom() {
    chat.scrollTop = chat.scrollHeight;
}

function isNearBottom() {
    return chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 50;
}

// Register user on blur
usernameInput.addEventListener("blur", () => {
    const name = usernameInput.value.trim();
    if (name && name !== currentUser) {
        currentUser = name;
        socket.emit("register", currentUser);
    }
});

// Send on Enter key
msgInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const msg = msgInput.value.trim();

    if (!currentUser) {
        alert("Enter your name!");
        return;
    }

    if (!msg) return;

    // Temp receiver logic
    const receiver = currentUser === "Agent" ? "Irfan" : "Agent";

    socket.emit("send_message", {
        sender: currentUser,
        receiver: receiver,
        text: msg
    });

    msgInput.value = "";
    msgInput.focus();
}

// Receive message
socket.on("receive_message", (msg) => {
    const shouldScroll = isNearBottom();

    const li = document.createElement("li");

    if (msg.sender === currentUser) {
        li.innerText = msg.text;
        li.classList.add("right");
    } else {
        li.innerText = msg.sender + ": " + msg.text;
        li.classList.add("left");
    }

    chat.appendChild(li);

    if (shouldScroll) scrollToBottom();
});

// Theme toggle
function toggleTheme(el) {
    const d = document.documentElement;
    const dark = d.getAttribute("data-theme") === "dark";
    d.setAttribute("data-theme", dark ? "light" : "dark");
    el.querySelector(".knob").textContent = dark ? "☀️" : "🌙";
}
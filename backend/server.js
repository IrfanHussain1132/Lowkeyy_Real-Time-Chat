const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Message = require("./message");

const app = express();
const server = http.createServer(app);

// 🔥 MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/Lowkeyy", {


    serverSelectionTimeoutMS: 5000,
    
})
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// 🔥 Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// 🔥 store users (username -> socketId)
const users = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ✅ REGISTER USER + SEND CHAT HISTORY
    socket.on("register", async (username) => {
        users[username] = socket.id;

        console.log("Users:", users);

        try {
            // 🔥 fetch old messages for this user
            const messages = await Message.find({
                $or: [
                    { sender: username },
                    { receiver: username }
                ]
            }).sort({ timestamp: 1 });

            // 🔥 send history to that user only
            socket.emit("chat_history", messages);

        } catch (err) {
            console.log("Error fetching messages:", err);
        }
    });

    // ✅ SEND MESSAGE (PRIVATE + STORE IN DB)
    socket.on("send_message", async ({ sender, receiver, text }) => {
        const receiverSocket = users[receiver];
        console.log("Incoming:", sender, receiver, text);
        try {
            // 🔥 SAVE MESSAGE
            const saved=await Message.create({
                sender,
                receiver,
                text
            });
            console.log("Saved to DB:", saved);
        } catch (err) {
            console.log("DB Error:", err);
        }

        // 🔥 SEND TO RECEIVER
        if (receiverSocket) {
            io.to(receiverSocket).emit("receive_message", {
                sender,
                text
            });
        }

        // 🔥 SEND BACK TO SENDER (for UI)
        socket.emit("receive_message", {
            sender,
            text
        });
    });

    // ✅ DISCONNECT USER
    socket.on("disconnect", () => {
        for (let user in users) {
            if (users[user] === socket.id) {
                delete users[user];
                break;
            }
        }

        console.log("User disconnected:", socket.id);
    });
});

// 🔥 Start server
mongoose.connection.once("open", () => {
    console.log("MongoDB ready");

    server.listen(3000, () => {
        console.log("Server running on port 3000");
    });
});
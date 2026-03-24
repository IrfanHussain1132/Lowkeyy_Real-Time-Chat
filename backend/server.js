require("dotenv").config();


console.log("ENV CHECK:", process.env.MONGO_URI);
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Message = require("./message");
console.log("ENV:", process.env.MONGO_URI);
const app = express();
const server = http.createServer(app);

// 🔥 MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
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

    // ✅ JOIN ROOM
    socket.on("join_room", async ({ username, roomId }) => {

        socket.join(roomId);
        socket.username = username;
        socket.roomId = roomId;

        console.log(`${username} joined ${roomId}`);

        // 🔥 notify others
        socket.to(roomId).emit("user_joined", { username });

        try {
            const messages = await Message.find({ roomId })
                .sort({ timestamp: 1 });

            socket.emit("chat_history", messages);

        } catch (err) {
            console.log(err);
        }
    });

    // ✅ SEND MESSAGE
    socket.on("send_message", async (text) => {

        if (!socket.roomId || !socket.username) return;

        const msgData = {
            roomId: socket.roomId,
            sender: socket.username,
            text
        };

        try {
            await Message.create(msgData);
        } catch (err) {
            console.log("DB Error:", err);
        }

        // 🔥 send to ALL in room (including sender)
        io.to(socket.roomId).emit("receive_message", msgData);
    });

    // ✅ TYPING
    socket.on("typing_start", () => {
        socket.to(socket.roomId).emit("user_typing", {
            username: socket.username
        });
    });

    socket.on("typing_stop", () => {
        socket.to(socket.roomId).emit("user_stopped_typing");
    });

    // ✅ CLEAR CHAT  ← moved inside connection block (this was the bug)
    socket.on("clear_chat", async () => {

        if (!socket.roomId) return;

        try {
            await Message.deleteMany({ roomId: socket.roomId });

            // 🔥 notify all users in room
            io.to(socket.roomId).emit("chat_cleared");

        } catch (err) {
            console.log("Clear error:", err);
        }
    });

    // ✅ DISCONNECT
    socket.on("disconnect", () => {
        if (socket.roomId && socket.username) {
            socket.to(socket.roomId).emit("user_left", {
                username: socket.username
            });
        }

        console.log("Disconnected:", socket.id);
    });
});

// 🔥 Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server running on port", PORT);
});

// Mongo connect separately
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("Mongo Error:", err));
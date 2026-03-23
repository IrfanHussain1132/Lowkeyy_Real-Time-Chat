const users = {};

function addUser(username, socketId) {
    users[username] = socketId;
}

function removeUser(socketId) {
    for (let user in users) {
        if (users[user] === socketId) {
            delete users[user];
        }
    }
}

function getUserSocket(username) {
    return users[username];
}

function getAllUsers() {
    return Object.keys(users);
}

module.exports = { addUser, removeUser, getUserSocket, getAllUsers };
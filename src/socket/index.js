import { Server } from "socket.io";

import registerSocketAuth from "./auth.socket.js";
import registerRoomEvents from "./room.socket.js";

let io;

function initializeSocket(server) {

    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    registerSocketAuth(io);

    io.on("connection", (socket) => {

        const userId = socket.userId;
        socket.join(userId);
        console.log(`User ${userId} connected and joined personal room`);

        registerRoomEvents(io, socket);
    });

}

export default initializeSocket;
export { io };
import { saveMessage } from "../services/message.service.js";
import { isUserInRoom } from "../services/room.service.js";

function registerRoomEvents(io, socket) {

    socket.on("join_room", async (roomId) => {

        const isMember = await isUserInRoom( roomId, socket.userId);
        if( !isMember ) {
            socket.emit("room_error", { message: "Unauthorized to join this room" });
            return;
        }

        socket.join(roomId);

        console.log(
            `User ${socket.userId} joined ${roomId}`
        );
    });

    socket.on("leave_room", (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.userId} detached from socket room ${roomId}`);
    });
    
    socket.on("send_message", async (data) => {

        const {roomId, content} = data;
        if(!roomId || !content) return;

        try {

            const isMember = await isUserInRoom(roomId, socket.userId);
            if (!isMember) {
                socket.emit("message_error", { message: "Unauthorized: You cannot send messages here" });
                return;
            }

            const sendMessage = await saveMessage(roomId, socket.userId, content);
            io.to(roomId).emit("recieve_message", sendMessage);

        } catch(error) {

            console.error("Failed to process message: ",error);
            socket.emit( `message_error`,
                {
                    message: "Failed to send message"
                }
            );

        }
    });

    socket.on("disconnect", () => {

        console.log(
            `User disconnected ${socket.userId}`
        );

    });

}
export default  registerRoomEvents;
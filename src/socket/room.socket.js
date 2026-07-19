import { saveMessage } from "../services/message.service.js";

function registerRoomEvents(io, socket) {

    socket.on("join_room", (roomId) => {

        socket.join(roomId);

        console.log(
            `User ${socket.userId} joined ${roomId}`
        );
    });

    socket.on("send_message", async (data) => {

        const {roomId, content} = data;
        if(!roomId || !content) return;

        try {

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
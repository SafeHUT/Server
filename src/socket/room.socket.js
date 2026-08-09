import { query } from "../db/connectionDb.js";
import { saveMessage } from "../services/message.service.js";
import { deleteMessage, editMessage, isUserInRoom } from "../services/room.service.js";

function registerRoomEvents(io, socket) {

    socket.on('join_room', async (roomId) => {
        
        const isMember = await isUserInRoom(roomId, socket.userId);
        if( !isMember ) {
            socket.emit("room_error", { message: "Unauthorized to join this room" });
            return;
        }

        socket.join(roomId);
        console.log(`User ${socket.userId} joined ${roomId}`);
        
        try {
            const result = await query(
                "SELECT public_key FROM users WHERE id = $1;", 
                [socket.userId] 
            );
            const newUserPublicKey = result.rows[0]?.public_key;

            if (newUserPublicKey) {
                socket.to(roomId).emit('new_user_joined', {
                    userId: socket.userId,
                    publicKey: newUserPublicKey
                });
            }
        } catch (error) {
            console.error("Error fetching public key on join:", error);
        }
    });

    socket.on('share_room_key', async (data) => {
        const { targetUserId, wrappedKey } = data;

        try {
            const userId = socket.user?.id || socket.userId;

            const result = await query(
                "SELECT public_key FROM users WHERE id = $1;", 
                [userId]
            );
            const senderPublicKey = result.rows[0]?.public_key;

            if (senderPublicKey) {
                socket.to(targetUserId).emit('receive_room_key', {
                    senderPublicKey: senderPublicKey,
                    wrappedKey: wrappedKey
                });
            }
        } catch (error) {
            console.error("Error routing shared room key:", error);
        }
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
            io.to(roomId).emit("receive_message", sendMessage);

        } catch(error) {

            console.error("Failed to process message: ",error);
            socket.emit( `message_error`,
                {
                    message: "Failed to send message"
                }
            );
        }
    });

    socket.on("delete_message", async (data) => {
        
        const { messageId, roomId } = data;
        if( !messageId || !roomId ) return;

        try {
            deleteMessage( messageId, socket.userId );
            io.to(roomId).emit("message_deleted", messageId);
        } catch(e) {
            console.error("Failed to delete message",e);
        }
    });

    socket.on("edit_message", async (data) => {

        const { messageId, roomId, newContent } = data;
        if( !messageId || !roomId || !newContent ) return;

        try {

            const updatedMsg = await editMessage(messageId, socket.userId, newContent);
            if(updatedMsg) {
                io.to(roomId).emit("message_edited",updatedMsg);
            }
        } catch(e) {

            console.error("Failed to edit message: ",e);
        }

    });

    socket.on("typing", (roomId) => {

        if( !roomId ) return
        socket.to(roomId).emit("user_typing");

    });
    socket.on("stop_typing",(roomId) => {

        if(!roomId) return;
        socket.to(roomId).emit("user_stopped_typing");

    });

    socket.on("disconnect", () => {

        console.log(
            `User disconnected ${socket.userId}`
        );

    });

}
export default  registerRoomEvents;
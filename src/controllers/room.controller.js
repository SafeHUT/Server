import {
    getRoomByCode,
    getRoomMembers,
    createRoom,
    addMembersToRoom,
    isUserInRoom,
    removeMemberFromRoom,
    getUserRooms,
    updateRoomName
} from "../services/room.service.js";
import { getMessageByRoomId } from "../services/message.service.js";
import crypto from "crypto";
import { asyncHandler } from "../utils/apiHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const create_new_room = asyncHandler(async(req,res) => {

    const { expires_in } = req.body;
    const userId = req.user.id;

    const expirationOption = {
        '1h': 60 * 60 * 1000,
        '4h': 4 * 60 * 60 * 1000, 
        '1d': 24 * 60 * 60 * 1000,
    };

    const selectedDuration = expires_in || '1d';
    if(!expirationOption[selectedDuration]) {
        throw new ApiError(400, "Invalid expiration time. Must be '1h', '4h' or '1d'");
    }

    const expiresAt = new Date(Date.now() + expirationOption[selectedDuration]);

    const roomCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const room = await createRoom(roomCode, userId, expiresAt);

    await addMembersToRoom(room.id, userId);

    return res.status(201).json(
        new ApiResponse(201, room, "Room created successfully")
    );
});

const join_existing_room = asyncHandler(async(req, res) => {

    const { room_code } = req.body;
    const userId = req.user.id;
    if(!room_code) {
        throw new ApiError(400, "room code is required");
    }

    const room = await getRoomByCode(room_code.toUpperCase());
    if(!room) {
        throw new ApiError(404, "Room not found or invalid code");
    }

    if(new Date() > new Date(room.expires_at)) {
        throw new ApiError(410, "This room has expired and no longer active");
    }

    try {
        await addMembersToRoom(room.id, userId);
    } catch(error) {
        if(error.code === '23505') {
            return res.status(200).json(
                new ApiResponse(200, room, "You are already in this room")
            );
        }
        throw new ApiError(500, "Could not join room");
    }

    return res.status(200).json(
        new ApiResponse(200, room, "Joined room successfully")
    );
});

const get_room_details = asyncHandler( async(req, res) => {

    const { room_code } = req.params;

    const room = await getRoomByCode(room_code.toUpperCase());  
    if(!room) {
        throw new ApiError(404, "Room not found");
    }

    if(new Date() > new Date(room.expires_at)) {
        throw new ApiError(410, "This room has expired and no longer active");
    }

    const members = await getRoomMembers(room.id);

    return res.status(200).json( 
        new ApiResponse(200, {room, members}, "Room details fetched")
    )
});

const get_room_messages = asyncHandler(async ( req, res ) => {

    const {roomId } = req.params;
    const userId  = req.user.id;
    console.log("room: ",roomId);
    const room = await getRoomByCode(roomId);
    if( !room ) {
        throw new ApiError(404, "Room does not exists");
    }

    const isMember = await isUserInRoom(room.id, userId);
    if( !isMember ) {
        throw new ApiError(403 ,"Access Denied: You are not member of this room");
    }

    // 1. Get pagination parameters from the URL query (e.g., ?page=1&limit=50)
    // Default to page 1 and 50 messages per page
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50; 
    const offset = (page - 1) * limit; 

    const messages = await getMessageByRoomId(room.id, limit, offset); 
    return res.status(200).json(
        new ApiResponse(
            200, {
                messages,
                page,
                limit,
                hasMore: messages.length === limit
            },
            "Chat history fetched successfully"
        ),
    );
});

const leave_room = asyncHandler( async ( req, res ) => {

    const { roomId } = req.params;
    const userId = req.user.id;

    const deletedCount = await removeMemberFromRoom( roomId, userId );
    if( deletedCount === 0 ) {
        throw new ApiError(400, "You are not a member of this room or it has already expired");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "left room successfully")
    );
})

const get_my_rooms = asyncHandler( async ( req, res ) => {

    const rooms = await getUserRooms(req.user.id);
    return res.status(200).json(
        new ApiResponse(200, rooms, "Rooms fetched successfully")
    )

})

const update_room_name = asyncHandler( async( req, res ) => {

    const { roomId } = req.params;
    const { name }  = req.body;
    const userId = req.user.id;

    if( !name || name.trim().length < 0 ) { 
        throw new ApiError(400, "Room name cannot be empty")
    }

    const updatedRoom = await updateRoomName(roomId, userId, name.trim());
    if( !updatedRoom ) throw new ApiError(403, "You are not a member of this room or it does not exists");

    res.status(200).json(
        new ApiResponse(200, updatedRoom, "Room name updated")
    )

})

export {
    create_new_room,
    join_existing_room,
    get_room_details,
    get_room_messages,
    leave_room,
    get_my_rooms,
    update_room_name
}
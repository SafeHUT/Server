import {
    getRoomByCode,
    getRoomMembers,
    createRoom,
    addMembersToRoom
} from "../services/room.service.js";
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

    const room = await getRoomByCode(room_code.toUpperCase);
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

    const room = await getRoomByCode(room_code.toUpperCase);  
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

export {
    create_new_room,
    join_existing_room,
    get_room_details
}
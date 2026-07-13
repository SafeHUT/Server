import {query} from "../db/connectionDb.js"

async function createRoom(roomCode, createdBy) {
    const result = await query(
        "INSERT INTO rooms(room_code, created_by) VALUES ($1, $2) RETURNING *;",
        [roomCode, createdBy]
    );
    return result.rows[0];
}

async function getRoomByCode(roomCode) {
    const result = await query(
        "SELECT * FROM rooms WHERE room_code = $1 RETURNING *;",
        [roomCode]
    );
    return result.rows[0];
}

async function addMembersToRoom(roomId, userId) {
    const result = await query(
        "INSERT INTO room_members(room_id, user_id) VALUES ($1, $2) RETURNING *;",
        [roomId, userId]
    );
    return result.rows[0];
}

async function getRoomMembers(roomId) {
    const result = await query(
        `SELECT u.id, u.anonymous_id, u.name, rm.joined_at
        FROM users u 
        JOIN room_members rm ON u.id = rm.user_id 
        WHERE rm.room_id = $1;`,[roomId]
    );
    return result.rows[0];
}

async function deleteExpiredRooms() {
    const result = await query(
        "DELETE FROM rooms WHERE expires_at < CURRENT_TIMESTAMP RETURNING id;"
    );
    return result.rowCount;
}

export {
    createRoom,
    getRoomByCode,
    getRoomMembers,
    deleteExpiredRooms,
    addMembersToRoom
}
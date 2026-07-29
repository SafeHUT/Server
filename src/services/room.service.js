import {query} from "../db/connectionDb.js"

async function createRoom(roomCode, createdBy, expiresAt) {
    const result = await query(
        "INSERT INTO rooms(room_code, created_by, expires_at) VALUES ($1, $2, $3) RETURNING *;",
        [roomCode, createdBy, expiresAt]
    );
    return result.rows[0];
}

async function getRoomByCode(roomCode) {
    const result = await query(
        "SELECT * FROM rooms WHERE room_code = $1;",
        [roomCode]
    );
    return result.rows[0];
}

async function getRoomById(roomId) {
    const result = await query(
        "SELECT * FROM rooms WHERE id = $1;",
        [roomId]
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
        WHERE rm.room_id = $1
        ORDER BY rm.joined_at ASC;`,[roomId]
    );
    return result.rows;
}

async function deleteExpiredRooms() {
    const result = await query(
        "DELETE FROM rooms WHERE expires_at < CURRENT_TIMESTAMP RETURNING id;"
    );
    return result.rowCount;
}

async function isUserInRoom( roomId, userId ) {
   const result = await query(
    `SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2;`,
    [roomId, userId]
   );     
   return result.rowCount > 0;
}

async function removeMemberFromRoom(roomId, userId) {
    const result = await query(
        "DELETE FROM room_members WHERE room_id = $1 AND user_id = $2 RETURNING *;",
        [roomId, userId]
    );
    return result.rowCount;
}

async function getUserRooms(userId) {
    const result = await query(
        `SELECT r.id, r.room_code as token, r.name, r.expires_at, rm.is_muted,
            (SELECT COUNT(*) 
             FROM messages m 
             WHERE m.room_id = r.id AND m.created_at > rm.last_read_at) as unread_count
         FROM rooms r
         JOIN room_members rm ON r.id = rm.room_id
         WHERE rm.user_id = $1
         ORDER BY r.created_at DESC;`,
        [userId]
    );
    return result.rows;
}

async function markRoomAsRead(roomId, userId) {
    await query(
        `UPDATE room_members 
         SET last_read_at = CURRENT_TIMESTAMP 
         WHERE room_id = $1 AND user_id = $2`,
        [roomId, userId]
    );
}

async function updateRoomName (roomId, userId, newName) {
    const result = await query(
        `UPDATE rooms 
        SET name = $1 
        WHERE id = (
            SELECT room_id FROM room_members WHERE room_id = $2 AND user_id = $3
        ) RETURNING id, name, room_code;
        `,[newName, roomId, userId]
    )
    return result.rowCount > 0 ? result.rows[0]: null;
}

async function toggleRoomMute( roomId, userId, isMuted ) {
    const result = await query(
        `
        UPDATE room_members 
        SET is_muted = $1
        WHERE room_id = $2 AND user_id = $3 
        RETURNING is_muted;
        `, [ isMuted, roomId, userId ]
    );
    return result.rowCount > 0 ? result.rows[0] : null;
}


export {
    createRoom,
    getRoomByCode,
    getRoomById,
    getRoomMembers,
    deleteExpiredRooms,
    addMembersToRoom,
    isUserInRoom,
    removeMemberFromRoom,
    getUserRooms,
    updateRoomName,
    toggleRoomMute,
    markRoomAsRead
}
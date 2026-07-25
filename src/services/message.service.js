import { query } from "../db/connectionDb.js";

async function saveMessage( roomId, senderId, content ) {
    const result = await query(
        `INSERT INTO messages( room_id, sender_id, content ) 
        VALUES ($1, $2, $3) RETURNING *;`,
        [roomId, senderId, content] 
    );
    return result.rows[0];
};

async function getMessageByRoomId( roomId, limit, offset ) {
    const result = await query(
        `SELECT 
            m.id,
            m.content,
            m.created_at,
            m.sender_id,      
            u.name as sender_name,
            u.anonymous_id as sender_anonymous_id
        FROM messages m 
        JOIN users u ON m.sender_id = u.id
        WHERE m.room_id = $1 
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3;
        `, [roomId, limit, offset]
    );
    return result.rows;
}

export {
    saveMessage,
    getMessageByRoomId,
};
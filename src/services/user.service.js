import { query } from "../db/connectionDb.js";

async function createUser(uuid) {
    const result = await query(
        "INSERT INTO users(anonymous_id) VALUES($1) RETURNING *;",
        [uuid]
    )
    return result.rows[0];
}

async function updateUserName(userId, name) {
    const result = await query(
        "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, anonymous_id, name, created_at;",
        [name, userId]
    );
    return result.rows[0];
}

async function deleteCurrentUser(id) {
    await query(
        "DELETE FROM users WHERE id = $1;",[id]
    );
}

async function updateAnonymousId(anonymousId, id) {

    const result = await query(
        "UPDATE users SET anonymous_id = $1 WHERE id = $2 RETURNING *;",
        [anonymousId, id]
    );
    return result.rows[0];

}


export {
    createUser,
    updateUserName, 
    deleteCurrentUser,
    updateAnonymousId,
}
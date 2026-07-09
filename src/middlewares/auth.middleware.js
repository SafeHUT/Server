import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/apiHandler.js";
import { query } from "../db/connectionDb.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ",""); 
    
    if(!token) {
        throw new ApiError(401, "Unauthorized request: No token provided");
    }

    try{
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const result = await query(
            "SELECT id, anonymous_id, name, created_at FROM users WHERE id = $1", 
            [decodeToken.id]
        );
        
        const user = result.rows[0];
        if(!user) 
            throw new ApiError(401, "Invalid Access Token: User does not exist");

        req.user = user;

        next();

    } catch(error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

export default verifyJWT;
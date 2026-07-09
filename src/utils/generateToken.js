import jwt from "jsonwebtoken";

const generateAccessToken = (userId, anonymousId) => {
    return jwt.sign(
        {
            id: userId,
            anonymousId: anonymousId,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

export default generateAccessToken;
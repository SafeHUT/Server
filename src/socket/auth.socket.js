import jwt from "jsonwebtoken";

export default function registerSocketAuth(io) {

    io.use((socket, next) => {

        try {

            const token = socket.handshake.auth?.token;

            if (!token)
                return next(new Error("No token"));

            const decoded = jwt.verify(
                token,
                process.env.ACCESS_TOKEN_SECRET
            );

            socket.userId = decoded.id;

            next();

        } catch {

            next(new Error("Invalid token"));

        }

    });

}
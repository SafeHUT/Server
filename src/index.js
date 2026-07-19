import "dotenv/config"
import express from "express";
import {query} from "./db/connectionDb.js";
import cron from "node-cron";
import http from "http"; 

import { deleteExpiredRooms } from "./services/room.service.js";

import userRouter from "./routes/user.route.js";
import roomRouter from "./routes/room.route.js";
import initializeSocket from "./socket/index.js";

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

// Routes 
app.use("/api/v1/user", userRouter);
app.use("/api/v1/room",roomRouter);

// cron jobs
cron.schedule("0 * * * *", async () => {
    try {
        const deletedCount = await deleteExpiredRooms();
        if (deletedCount > 0) {
            console.log(`Cron: Cleaned up ${deletedCount} expired rooms.`);
        }
    } catch (error) {
        console.error("Cron Error: Failed to clean up rooms", error);
    }
});

// test db
app.get("/test", async (req, res) => {
    const result = await query("SELECT NOW()");
    res.json(result.rows);
});

initializeSocket(server);

const PORT = 4000;
server.listen(PORT,() => {
    console.log("Server is running on port 4000");
})

import "dotenv/config"
import express, { json } from "express";
import {query} from "./db/connectionDb.js";
import userRouter from "./routes/user.route.js";

const app = express();

// Middlewares
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

// Routes 
app.use("/api/v1/user", userRouter);

app.get("/test", async (req, res) => {
    const result = await query("SELECT NOW()");
    res.json(result.rows);
});

app.listen("4000",() => {
    console.log("listing to port 4000");
})

import {Router} from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    join_existing_room,
    create_new_room,
    get_room_details
} from "../controllers/room.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/create", create_new_room);
router.post("/join", join_existing_room);
router.get("/:room_code", get_room_details);

export default router;
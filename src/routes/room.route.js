import {Router} from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    join_existing_room,
    create_new_room,
    get_room_details,
    get_room_messages,
    leave_room,
    get_my_rooms,
    update_room_name
} from "../controllers/room.controller.js";

const router = Router();

router.use(verifyJWT);


router.get("/my-rooms",get_my_rooms);
router.post("/create", create_new_room);
router.post("/join", join_existing_room);
router.get("/:room_code", get_room_details);
router.patch("/:roomId/name",update_room_name);

router.get("/:roomId/messages",get_room_messages);
router.delete("/:roomId/leave",leave_room);


export default router;
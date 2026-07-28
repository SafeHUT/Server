import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    generate_user,
    get_current_user,
    update_name,
    delete_current_user,
    generate_new_anonymous_id
} from "../controllers/user.controller.js"

const router = Router();
router.post("/", generate_user);

// secure route
router.patch("/name", verifyJWT, update_name);
router.route("/current-user")
    .get(verifyJWT, get_current_user)
    .delete(verifyJWT, delete_current_user);

router.patch("/regenerate-id", verifyJWT, generate_new_anonymous_id);

export default router;
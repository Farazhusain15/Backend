import {Router} from "express";
import { loginUser, registeUser } from "../controllers/user.controller.js";

const router=Router();

router.route('/register').post(registeUser)
router.route('/login').post(loginUser)

export default router;
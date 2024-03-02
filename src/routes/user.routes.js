import {Router} from "express";
import { loginUser, logoutUser, refershAccessToken, registeUser } from "../controllers/user.controller.js";
import {upload} from '../middlewares/multer.middleware.js';
import { varifyJwt } from "../middlewares/auth.middleware.js";


const router=Router();

router.route('/register').post(
    upload.fields([
  {
    name:"avatar",
    maxCount: 1
  },
  {
    name:"coverImage",
    maxCount: 1
  }
    ]),
    registeUser)
router.route('/login').post(loginUser)

//secured routes
router.route("/logout").post(varifyJwt ,logoutUser)
router.route("/refresh-token").post(refershAccessToken)

export default router;
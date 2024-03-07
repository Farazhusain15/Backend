import {Router} from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refershAccessToken, registeUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
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
router.route("/change-password").post(varifyJwt,changeCurrentPassword)
router.route("/current-user").get(varifyJwt,getCurrentUser)
router.route("/update-account").patch(varifyJwt,updateAccountDetails)
router.route("/avatar").patch(varifyJwt, upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(varifyJwt, upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(varifyJwt, getUserChannelProfile)
router.route("/history").get(varifyJwt,getWatchHistory);

export default router;
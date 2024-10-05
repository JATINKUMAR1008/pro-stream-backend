import { Router } from "express";
import { changeCurrentPassword, changeUserImage, getUserData, loginUser, logoutUser, refreshAccessToken, registerUser, verifyUser} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
        name: "avatar",
        maxCount: 1,
        },{
        name: "cover",
        maxCount: 1,
    }]),
    registerUser
)

router.route("/login").post(loginUser)
router.route("/logout").get(verifyJWT,logoutUser)
router.route("/refresh-token").get(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/images").patch(verifyJWT,upload.fields([
    {
    name: "avatar",
    maxCount: 1,
    },{
    name: "cover",
    maxCount: 1,
}]),changeUserImage)
router.route("/").get(verifyJWT,getUserData)
router.route("/verify").post(verifyUser)

export default router;
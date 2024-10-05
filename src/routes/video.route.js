import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { uploadVideo,fetchVideo, fetchPublishedVideos, publishVideo,fetchVideos } from "../controllers/video.controller.js";
import { upload } from "../middleware/multer.middleware.js";
const router = Router()

router.route("/").post(verifyJWT,upload.fields([
    {
        name:"video",
        maxCount:1
    },{
        name:"thumb",
        maxCount:1
    }
]),uploadVideo)
router.route("/id/:videoId").get(verifyJWT,fetchVideo)
router.route("/published").get(verifyJWT,fetchPublishedVideos)
router.route("/publish/:videoId").patch(verifyJWT,publishVideo)
router.route("/").get(verifyJWT,fetchVideos)
export default router   
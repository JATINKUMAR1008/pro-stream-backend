import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { SendErrResponse } from "../utils/ErrorResponse.js";
import { uploadOnS3 } from "../utils/s3.js";
import { uploadVideoOnS3 } from "../utils/uploadVideo.js";
import {v4 as uuidv4} from 'uuid'
const uploadVideo = asyncHandler(async(req,res)=>{
    try {
        const {title,description} = req.body
        const filepath = req?.files?.video?.[0]
        const thumbnail = req?.files?.thumb?.[0]
        if(!filepath){
            throw new ApiErrors(400,"Video file is required")
        }
        const filename = await uploadVideoOnS3(filepath,uuidv4())
        let thumb = ""
        if(thumbnail){
            thumb = await uploadOnS3(thumbnail,`${filename}Thumb`)
        }
        const video = await Video.create({
            title,
            description,
            videoFile: filename,
            thumbnail:thumb,
            owner: req.user?._id,
        })
        const createVideo = await Video.findById(video._id)
        if(!createVideo){
            throw new ApiErrors(500,"Error registering video")
        }
        console.log(createVideo)
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Video Uploaded",
                {video:createVideo}
            )
        )
    } catch (error) {
        SendErrResponse(error,res)
    }
})

const fetchVideo = asyncHandler(async(req,res)=>{
    try {
        const {videoId} = req.params
        const video = await Video.findById(videoId)
        video.views  = Number(video.views) + 1
        video.save()
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Video fecthed",
                {video}
            )
        )
    } catch (error) {
        SendErrResponse(error,res)
    }
})

const fetchPublishedVideos = asyncHandler(async(req,res)=>{
 try {
    const videoList = await Video.aggregate([
        {
            "$match": {
              isPublished: true
            },
        },
        {
            $lookup: {
              from: "users",
              let: { ownerId: "$owner" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$_id", "$$ownerId"]
                    }
                  }
                },
                {
                  $project: {
                    username: 1,
                    avatar: 1
                  }
                }
              ],
              as: "owner"
            }
          },
    ])
    if(!videoList.length){
        throw new ApiErrors(404,"No videos found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Videos fetched",
            {videoList}
        )
    )
 } catch (error) {
    SendErrResponse(error,res)
 }   
})

const publishVideo = asyncHandler(async(req,res)=>{
    try {
        const {videoId} = req.params
        const video = await Video.findById(videoId)
        video.isPublished = true
        video.save()
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Video published",
                {video}
            )
        )
    } catch (error) {
        SendErrResponse(error,res)
    }
})

const fetchVideos = asyncHandler(async(req,res)=>{
    try {
        const videos = await Video.find({owner:req.user?._id})
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Videos fetched",
                {videos}
            )
        )
    } catch (error) {
        SendErrResponse(error,res)
    }
})

export {uploadVideo,fetchVideo,fetchPublishedVideos,publishVideo,fetchVideos}
import { User } from "../models/user.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { SendErrResponse } from "../utils/ErrorResponse.js";
export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new ApiErrors(401,"Unauthorized request")
        }
        const decodeToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        if(!decodeToken){
            throw new ApiErrors(401,"Invalid access token")
        }
        const user = await User.findById(decodeToken?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiErrors(401,"Invalid Access Token")
        }
        req.user = user
        next()
    } catch (error) {
        SendErrResponse(error,res)
    }
})
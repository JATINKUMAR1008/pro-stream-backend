import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { SendErrResponse } from "../utils/ErrorResponse.js";
import { uploadOnS3 } from "../utils/s3.js";
import jwt from "jsonwebtoken";
import { sendEmail,verifyOtp } from "../utils/Email.js";
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();
    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiErrors(
      400,
      "Error while generating Access and Refresh tokens."
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { fullname, email, username, password } = req.body;
    if (
      [fullname, email, username, password].some((field) => {
        field?.trim() === "";
      })
    ) {
      throw new ApiErrors(400, "All fields are required");
    }
    const existedUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existedUser) {
      throw new ApiErrors(409, "User already existed");
    }
    let avatar = "";
    if (req.files?.avatar?.[0]?.path) {
      avatar = await uploadOnS3(req.files.avatar[0], username);
    }
    let cover = "";
    if (req.files?.cover?.[0]?.path) {
      cover = await uploadOnS3(req.files.cover[0], `${username}Cover`);
    }

    const newUser = await User.create({
      fullname,
      email,
      username: username.toLowerCase(),
      password,
      avatar: avatar || "",
      coverImage: cover || "",
    });

    const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiErrors(500, "Failed to create user");
    }

    sendEmail(newUser._id, email);

    return res
      .status(201)
      .json(new ApiResponse(201, "User created successfully", createdUser));
  } catch (err) {
    SendErrResponse(err, res);
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if ((!username && !email) || !password) {
      throw new ApiErrors(400, "Username or email and password is required");
    }
    const user = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (!user) {
      throw new ApiErrors(404, "User does not exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiErrors(401, "Invalid user credentials");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, "User logged in Successfully", {
          user: loggedInUser,
          accessToken,
          refreshToken,
        })
      );
  } catch (err) {
    SendErrResponse(err, res);
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      }
    );
    return res
      .status(200)
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .json(new ApiResponse(200, {}, "User logged Out."));
  } catch (err) {
    SendErrResponse(err, res);
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingToken) {
      throw new ApiErrors(401, "Unauthorized request");
    }
    const decodeToken = jwt.verify(
      incomingToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodeToken?._id);
    if (!user) {
      throw new ApiErrors(401, "Invalid token");
    }
    if (incomingToken !== user?.refreshToken) {
      throw new ApiErrors(401, "invalid token");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user?._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, "Tokens reset", { accessToken, refreshToken })
      );
  } catch (error) {
    SendErrResponse(error, res);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      throw new ApiErrors(400, "Required both old and new passwords");
    }
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
      throw new ApiErrors(401, "Invalid password");
    }
    user.password = newPassword;
    user.save();
    return res.status(200).json(new ApiResponse(200, "Password changed", {}));
  } catch (error) {
    SendErrResponse(error, res);
  }
});

const changeUserImage = asyncHandler(async (req, res) => {
  try {
    if (!req?.files?.avatar?.[0] && !req?.files?.cover?.[0]) {
      throw new ApiErrors(400, "images are required");
    }
    const user = await User.findById(req.user?._id);
    if (req?.files?.avatar?.[0]) {
      const avatarImage = await uploadOnS3(
        req?.files?.avatar?.[0],
        user?.username
      );
      user.avatar = avatarImage;
    }
    if (req?.files?.cover?.[0]) {
      const cover = await uploadOnS3(
        req?.files?.cover?.[0],
        `${user?.username}Cover`
      );
      user.coverImage = cover;
    }
    user.save();
    return res.status(200).json(new ApiResponse(200, "Image updated", {}));
  } catch (error) {
    SendErrResponse(error, res);
  }
});

const getUserData = asyncHandler(async (req, res) => {
  try {
    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user?._id) // Ensure req.user._id exists
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "uploads",
          
        }
      },
      {
        "$project":{
          "refreshToken":0,
          "password":0,
          "updatedAt":0,
          "_id":0
        }
      }
    ]);

    if (!user.length) {  
      throw new ApiErrors(400, "User not found");
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        "User",
        { user: user[0] }  
      )
    );

  } catch (error) {
    SendErrResponse(error, res);
  }
});

const verifyUser = asyncHandler(async(req,res)=>{
    try {
        const {otp,userId} = req.body
        if(!otp){
            throw new ApiErrors(400,"OTP is required")
        }
        await verifyOtp(otp,userId)
        const user = await User.findById(userId)
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
          user._id
        );
        const loggedInUser = await User.findById(user._id).select(
          "-password -refreshToken"
        );
    
        return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .json(
            new ApiResponse(200, "User logged in Successfully", {
              user: loggedInUser,
              accessToken,
              refreshToken,
            })
          );
    } catch (error) {
        SendErrResponse(error,res)
    }
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  changeUserImage,
  getUserData,
  verifyUser
};

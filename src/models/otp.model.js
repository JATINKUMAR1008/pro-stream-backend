import mongoose, {Schema} from "mongoose";

const otpSchema = new Schema({
    userId:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 1800
    }
})

export const Otp = mongoose.model("Otp", otpSchema)
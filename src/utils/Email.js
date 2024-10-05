import nodemailer from "nodemailer"
import { Otp } from "../models/otp.model.js"
import { User } from "../models/user.model.js"

const createOTP = () =>{
    return Math.floor(100000 + Math.random() * 900000)
}

const emailTemplate =(otp)=>{
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Identity</title>
</head>
<body style="font-family: 'IBM Plex Sans', Arial, sans-serif; line-height: 1.6; color: #161616; background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 20px 0; text-align: left;">
                <h1 style="color: #0f62fe; margin: 0; font-size: 28px; font-weight: 400;">Verify Your Identity</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 20px 0;">
                <p style="margin-bottom: 20px; font-size: 16px;">Dear User,</p>
                <p style="margin-bottom: 30px; font-size: 16px;">To verify your identity, please enter the following one-time password (OTP):</p>
                <p style="text-align: center; margin-bottom: 30px; font-size: 24px; font-weight: 600;">${otp}</p>
                <p style="margin-top: 30px; font-size: 14px; color: #525252;">This OTP is valid for the next 30 minutes. If you did not request this verification, please disregard this email.</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 20px 0; text-align: left; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0; font-size: 12px; color: #525252;">&copy; 2024 elvideos. All rights reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
`
} 

const verifyOtp = async(otp,user_id)=>{
    try {
        const otpDoc = await Otp.findOne({userId:user_id,otp})
        if(!otpDoc){
            throw new ApiErrors(400,"Invalid OTP")
        }
        const user = await User.findById(user_id)
        if(!user){
            throw new ApiErrors(404,"User not found")
        }
        user.isVerified = true
        await user.save()
        await Otp.findByIdAndDelete(otpDoc._id)
    } catch (error) {
        throw new ApiErrors(500,"Error while verifying OTP")
    }
}

const sendEmail = async (userId,email) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    })
    const otp = createOTP()
    const otpDoc = await Otp.create({
        userId,
        otp: otp
    })
    const newOtp = await Otp.findById(otpDoc._id)
    if(!newOtp){
        throw new ApiErrors(500,"Error while creating OTP")
    }
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "OTP for account verification",
        html: emailTemplate(otp)
    }

    try {
        await transporter.sendMail(mailOptions)
    } catch (error) {
        throw new ApiErrors(500,"Error while sending email")
    }
}

export {verifyOtp,sendEmail}
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGO_URI}/${DB_NAME}`,
        )
        console.log(`Connected to ${connectionInstance.connection.name} database`)
    }catch(error){
        console.error("Database error: ", error)
        process.exit(1)
    }
}

export default connectDB
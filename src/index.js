import dotenv from 'dotenv'
import connectDB from './db/index.js'
import { app } from './app.js'
dotenv.config({
    path: "./.env"
})
const PORT = process.env.PORT || 8000
connectDB().then(()=>{
    app.listen(PORT ,()=>{
        console.log("app is listing on port ",PORT)
    })
    app.on('error',(error)=>{
        console.error("Error starting server: ",error)
    })
}).catch((error)=>{
    console.error("Error connecting to MongoDB: ",error)
})

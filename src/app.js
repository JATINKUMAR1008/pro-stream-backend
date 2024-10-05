import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';
const app = express();
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}))
// app.options('*', cors(
//     {
//         origin: [process.env.CORS_ORIGIN],
//         credentials: true,
//     }
// ))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//routes import

import userRouter from './routes/user.route.js'
import videoRouter from "./routes/video.route.js"

app.use('/api/v1/user',userRouter)
app.use('/api/v1/video',videoRouter)
export {app}
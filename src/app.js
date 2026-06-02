import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true;
}))

//configurations
//aceept json data with size 16kb
app.use(express.json({ limit: "16kb" }))

//extended is for object in object encoding
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

//serving static files like HTML, CSS, JavaScript, images, and fonts directly from a folder.
app.use(express.static("public"))

//to set cookie to user browser or read cookie from user browser.
app.use(cookieParser())

app.get('/', (req, res) => {
    res.send("Hi from backedn")
}
)

export { app }
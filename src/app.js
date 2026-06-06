import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();

//origin: process.env.CORS_ORIGIN:defines the specific whitelist of frontend URLs allowed to access your backend API.When a browser makes a request to your API, the cors() middleware checks if the incoming browser URL matches this process.env.CORS_ORIGIN value. If it matches, the backend attaches this header to the response.
// credentials: true: you are telling the server to look for and accept three specific types of data from incoming frontend requests:Cookies: Auth tokens or session IDs saved in the browser.HTTP Authentication: Headers like Authorization: Bearer <token>.TLS Client Certificates: Secure cryptographic identity keys.
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//configurations: Node.js, by default, is completely raw and blank. It does not know how to read JSON data, parse form submissions, serve images, or handle cookies out of the box.
//aceept json data with size 16kb
//This middleware intercepts raw streams of data and converts them into a clean JavaScript object available at req.body
app.use(express.json({ limit: "16kb" }))

//extended is for object in object encoding
//This handles traditional HTML <form> submissions (the format looks like name=john&age=30).extended: true does: It allows the server to parse complex, deeply nested objects and arrays sent via forms (using the qs library under the hood). If set to false, you can only parse simple key-value strings.
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

//serving static files like HTML, CSS, JavaScript, images, and fonts directly from a folder.
// If you have an image file at ./public/images/logo.png, your server cannot automatically share it with the internet.This line makes the entire public directory open to the world. A user can type https://yourdomain.com directly into their browser, and Express will serve the file instantly without you having to write a custom route for it. It is perfect for logos, PDF downloads, or favicons.
app.use(express.static("public"))

//to set cookie to user browser or read cookie from user browser.
//Browsers send cookies back to the server inside a messy, single string within the raw HTTP request header (e.g., Cookie: session=123; theme=dark).This middleware reads that complex string, breaks it down, and turns it into a clean, searchable JavaScript object. It places this object at req.cookies (or req.signedCookies if you use secret keys). Without this, verifying if a user is logged in via cookies is incredibly tedious.
app.use(cookieParser())

//routes import
import userRouter from "./routes/user.routes.js"

//This line of code is the router mount point. It sets up a clean, structured URL path for all user-related features in your application (like registration, login, and profile updates).
//routes declaration
app.use("/api/v1/users", userRouter)

export { app }
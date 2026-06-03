import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    const { username, email, fullName, password } = req.body;
    console.log(email)
    //validations - not empty
    if ([fullName, email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    //check if user already exist: username & email
    const existedUser = User.findOne({
        $or: [
            { username }, { email }
        ]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }

    //check for images, check for avatar (with multer provides files from middleware)
    //so bascially on request submit multer will take the file and save it on our local public folder with original name
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //upload to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    //create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //remove password & refresh token fields from response
    const createduser = await User.findById((user._id)).select(
        "-password -refreshToken"
    )

    if (!createduser) {
        throw new ApiError(500, "Something went wrong while user register")
    }

    //checkfor user creation: return response else error
    return res.status(201).json(
        new ApiResponse(200, createduser, "User registered successfully")
    )

})

export { registerUser } 
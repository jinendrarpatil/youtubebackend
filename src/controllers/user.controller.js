import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh & access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    const { username, email, fullName, password } = req.body;
    // console.log(email)
    //validations - not empty
    if ([fullName, email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    //check if user already exist: username & email
    const existedUser = await User.findOne({
        $or: [
            { username }, { email }
        ]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }

    //check for images, check for avatar (with multer provides files from middleware)
    //so bascially on request submit multer will take the file and save it on our local public folder with original name
    // console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath = null
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

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

const loginUser = asyncHandler(async (req, res) => {
    //get data from req.body username, emil, passowrd
    const { email, userName, password } = req.body;

    //validate username or email;
    if (!userName && !email) {
        throw new ApiError(400, "Email or username is required")
    }

    //find user exist
    const user = await User.findOne({
        $or: [
            { userName }, { email }
        ]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    //check password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    //generate access & refresh token 
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    console.log("accessToken", accessToken)

    //send in cockies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        //t tells the browser that only the server is allowed to read or touch this cookie.
        //It completely hides the cookie from frontend JavaScript.If a hacker tries to run console.log(document.cookie) on your website, your accessToken and refreshToken will show up as completely blank.The cookie can still be automatically attached to your API requests, but scripts cannot read or steal it.
        httpOnly: true,
        // It forces the browser to only send the cookie over encrypted https:// connections.
        //If a user logs into your site while using public coffee shop Wi-Fi, an attacker on the same network could intercept raw internet traffic. If secure is set to false, the cookie travels in plain text, allowing the attacker to steal the token out of mid-air. Setting it to true ensures it is always encrypted during transit.
        secure: true
    }

    //login success response
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                }, "User logged in Successfully")
        )
})


const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            },
        },
        {
            new: true
        });


    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id);

        if (!User) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "expired refresh token")
        }

        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(
                200,
                {
                    accessToken, refreshToken: newRefreshToken
                },
                "Access token refreshed"
            ))
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalide uer password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(new ApiResponse(200, {}, "password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }).select("-password")

    return res.status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
})


const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await user.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")


    return res.status(200).
        json(new ApiResponse(200, user, "avatar image uploaded successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage")
    }

    const user = await user.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")


    return res.status(200).
        json(new ApiResponse(200, user, "coverImage image uploaded successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            //This acts exactly like a standard find() query. It is the gatekeeper of the pipeline.
            //It looks through your entire users collection and pulls out only the document where the username matches the one passed into the function (converted safely to lowercase).
            $match: {
                username: username?.toLowerCase()
            }
        },
        {//$lookup is MongoDB’s version of a SQL JOIN. It lets you link two different collections together.
            //The user object moving down the line now has a brand new array attached to it called subscribers, filled with every single subscription document where this user is the host channel.
            $lookup: {
                from: "subscriptions",    // 1. Look inside the 'subscriptions' collection
                localField: "_id",        // 2. Take the '_id' of the current User
                foreignField: "channel",  // 3. Find matching rows where 'channel' matches that id
                as: "subscribers"         // 4. Dump all matches into an array named 'subscribers'
            }
        },
        {//The user object now gets a second array attached to it called subscribedTo.
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber", // 👈 Notice the swap: matching against 'subscriber' now
                as: "subscribedTo"          // 👈 Dump into a new array
            }
        },
        {
            $addFields: {
                subScribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subScribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    console.log("channel", channel)

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }
    return res.status(200)
        .json(new ApiResponse(200, channel[0], "user channel fetched successfully"))
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile } 
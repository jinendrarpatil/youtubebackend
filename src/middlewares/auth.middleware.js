import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const cookieToken = req.cookies?.accessToken;
        const bearerToken = req.header("Authorization");
        const token = typeof cookieToken === "string"
            ? cookieToken
            : typeof bearerToken === "string"
                ? bearerToken.replace("Bearer ", "")
                : undefined;

        console.log("token from cookie", token)

        if (!token || typeof token !== "string") {
            throw new ApiError(401, "Unauthorized request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid access token")
    }

})
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true // mongodb optimizes the search with index (not each filed is required indexing else it lowers the performance)
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary url
            required: true,
        },
        coverImage: {
            type: String, //cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        refreshToken: {
            type: String
        }

    },
    { timestamps: true }
)

// pre hook from mongoose is run with various events e.g just before data save in database
// we cannot use arrow function here because it wont have this contex so we need to use normal function to get context of our schema,
// thi operation takes time so it has to be async and once done we need to hand it off to next operation as a middleware
userSchema.pre("save", async function (next) {
    // to avoid password being hashed always we have isModified method to check if the field is actually modified
    if (!this.isModified("password")) {
        return
    }
    //take password incrypt it before saving
    this.password = await bcrypt.hash(this.password, 10)
})

//we can create custome methods
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function () {
    return await jwt.sign({
        //take mongod id from database with this._id
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    }, process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        })
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        //take mongod id from database with this._id, kept less payload as it will be frequestly used and we want to keep it light weight
        _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        })

}
export const User = mongoose.model("User", userSchema)
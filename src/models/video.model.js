import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

/*{
mongoose-aggregate-paginate-v2 is a specialized Mongoose plugin used to add pagination capabilities directly to your MongoDB Aggregation Pipelines.
If your database contains 10,000 videos, you cannot send all 10,000 to the frontend at once without crashing the browser. 
You must break them up into smaller chunks (e.g., 10 videos per page). 
This plugin automates that math.}*/

const videoSchema = new Schema({
    videoFile: {
        type: String,//cloudinary url
        required: true
    },
    thumbnail: {
        type: String,//cloudinary url
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
}, {
    timestamps: true
})


videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema)
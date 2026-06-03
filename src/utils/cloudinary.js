import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //uploda file on cloudinary

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        //file has been uploaded successfuly
        console.log("file is uploaded on cloudinary", response)
        return response
    } catch (error) {
        //remove locally saved temparory file as te upload operation is failed
        fs.unlinkSync(localFilePath)
        return null

    }
}

export { uploadOnCloudinary };
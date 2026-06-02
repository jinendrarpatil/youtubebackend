import mongoose from "mongoose";
import { DB_NAME } from "../constansts.js";

const connectDB = async () => {
    try {
        const connectionInstane = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstane.connection.host}`);

    } catch (e) {
        console.log("MONGODB connection failed", error);
        //node js gives access to process which can be used anywhere, process is nothng but a reference on which our app is runnning
        process.exit(1)
    }
}

export default connectDB;
// require('dotenv').config({ path: './env' })
import 'dotenv/config';
import connectDB from './db/index.js';


connectDB()

// approach 1
//; (async () => {
//     try {
//         await mongoose.connect(`{process.env.MONGODB_URI}/${DB_NAME}`)

//         app.on("error", (error) => {
//             console.error("Error", error)
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log("listening on port", process.env.PORT);
//         }
//         )

//     } catch (error) {
//         console.error("ERROR: ", error)
//         throw error
//     }
// })()

//approch 2
// async function connectDB() {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.error("Error ", error)
//             throw error
//         }
//         )
//         app.listen(process.env.PORT, () => {
//             console.log("listening at port", process.env.PORT);
//         }
//         )
//     } catch (error) {
//         console.error("Error ", error)
//         throw error
//     }

// }

// connectDB()

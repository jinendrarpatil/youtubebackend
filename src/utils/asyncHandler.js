
//old way
// const asyncHandler = function (fn) {
//     return function (req, res, next) {
//         // Inner function body goes here
//     };
// };

//this is a wrapper (HOF) which take one function and pass it to another function

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err))
    }
}

//or

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)

//     } catch (error) {
//         res.status(error.code || 500).json(({
//             success: false,
//             message: error.message
//         }))
//     }
// }

export { asyncHandler }
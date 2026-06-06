
//old way
// const asyncHandler = function (fn) {
//     return function (req, res, next) {
//         // Inner function body goes here
//     };
// };

//this is a wrapper (HOF) which take one function and pass it to another function

// 1. You pass your async e.g logout code (requestHandler) into the wrapper.
const asyncHandler = (requestHandler) => {
    // 2. This returns a standard function that Express expects for any route.
    return (req, res, next) => {
        // 3. This executes your async logout function. Because it's async, it returns a Promise. from this return function req, res next arguments will be sent to requestHandler;
        Promise.resolve(requestHandler(req, res, next))
            // 4. If your logout code crashes (e.g., database is down), this catch block grabs the error and passes it to next(err).
            // Express then cleanly handles the error instead of crashing the server.
            .catch((err) => next(err))
    }
}

/*{"The catch block grabs the error and passes it to next(err)" means Express handles the error instead of crashing.
 When an error happens inside an asynchronous function, JavaScript generates an error object(which contains the error message and the exact line number where it crashed).
 Here is what happens step - by - step when asyncHandler captures that error object:
 Step A: Grabbing the Error: If your database goes offline, User.findByIdAndUpdate breaks.The promise rejects, and the.catch((err) => ...) block wakes up.
 The variable err becomes that specific error object containing the database failure details.
 Step B: Passing it to next(err): The code then executes next(err).In Express, the next() function is a special steering wheel.If you call it empty like next(), Express moves to the next regular route in line.
 If you pass an argument into it like next(err), Express instantly triggers an internal alarm.It says, "Stop everything! A route just crashed. Skip all normal routes and send this error straight to the Error Handling Middleware.
 "Step C: The Safety Net in Action: Because Express diverts the error into its dedicated error pipeline, your application stays alive.If you didn't have next(err), the unhandled promise rejection would immediately kill your Node.js process (process.exit(1)),
  crashing your application for every single user currently browsing your website.
  If you do not write a custom error-handling middleware, Express does not crash. Instead, it sends the error straight to its built-in Default Error Handler.But relying on it has security risk & bad FE expereince (because it sends ugly HTML page instead of json)
}*/


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
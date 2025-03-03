

const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Intrenal Server Error";
    err.statusCode = err.statusCode || 500;

    if(err.code === 11000){
        const error = Object.keys(err.keyPattern).join(", ")
        err.message = `Duplicate field - ${error}`;
        err.statusCode = 400;
    }

    if(err.name === "CastError") {
        const errorPath = err.path;
        err.message = `Invalid format of ${errorPath}`;
        err.statusCode = 400;
    }

    return res.status(err.statusCode).json({
        success: false,
        message: process.env.NODE_ENV ? err : err.message,
    })
};

export { errorMiddleware };
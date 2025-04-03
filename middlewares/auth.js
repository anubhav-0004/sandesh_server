import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/utility.js";
import User from "../models/user.model.js";

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies["sandesh-token"];
        if(!token) return next(new ErrorHandler("Please Login", 401));
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedData._id;
        next();
    } catch (error) {
        next(error);
    }
}

const adminOnly = async (req, res, next) => {
    try {
        const token = req.cookies["sandesh-admin-token"];
        if(!token) return next(new ErrorHandler("Please Login as admin", 401));
        const secretKey = jwt.verify(token, process.env.JWT_SECRET);
        const adminSecretKey = process.env.ADMIN_SECRET_KEY || "anubhav-0004";

        const isMatched = secretKey.secretKey.toString().trim() == adminSecretKey.toString().trim();
        if(!isMatched)  return next(new ErrorHandler("Only admin can access this route.", 401));

        next();
    } catch (error) {
        next(error);
    }
}

const socketAuthenticator = async (err, socket, next) => {
    try {
        if(err) return next(err);

        const authToken = socket.request.cookies["sandesh-token"];

        if(!authToken) return next(new ErrorHandler(" Please login to access this route", 401));

        const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);

        socket.user = await User.findById(decodedData._id);
        return next();

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Please login to access this route", 401));
    }
}

export { isAuthenticated, adminOnly, socketAuthenticator };
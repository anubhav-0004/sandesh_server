import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/utility.js";

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

        const isMatched = secretKey == adminSecretKey;
        if(!isMatched)  return next(new ErrorHandler("Only admin can access this route.", 401));

        next();
    } catch (error) {
        next(error);
    }
}

export { isAuthenticated, adminOnly };
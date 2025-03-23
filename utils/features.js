import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { v2 as cloudinary } from "cloudinary";
import { getBase64 } from "../lib/helper.js";

const connectDB = (uri) => {
  mongoose
    .connect(uri, { dbName: "Sandesh" })
    .then((data) => console.log(`Connected to DB: ${data.connection.host}`))
    .catch((err) => {
      throw err;
    });
};

const sendToken = (res, user, code, message) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  return res
    .status(code)
    .cookie("sandesh-token", token, {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      httpOnly: true,
      secure: true,
    })
    .json({
      success: true,
      token,
      message,
    });
};

const cookieOption = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

const emitEvent = (req, event, users, data) => {
  console.log("Emitting Event", event);
};

const uploadOnCloudianry = async (files = []) => {
  // Upload files to cloudinary
  const uploadPromise = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });

  try {
    const results = await Promise.all(uploadPromise);
    const formattedResult = results.map((result) => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));

    return formattedResult;
  } catch (error) {
    throw new Error("Error uploading files to cloudinary", error);
  }
};

const deleteFilesFromCloudinary = async (public_ids) => {};

export {
  connectDB,
  sendToken,
  emitEvent,
  cookieOption,
  deleteFilesFromCloudinary,
  uploadOnCloudianry,
};

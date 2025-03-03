import mongoose from "mongoose";
import jwt from "jsonwebtoken";


const connectDB = (uri) => {
  mongoose
    .connect(uri, { dbName: "Sandesh" })
    .then((data) => console.log(`Connected to DB: ${data.connection.host}`))
    .catch((err) => {
      throw err;
    });
};

const sendToken = (res, user, code, message) => {
  const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET);

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
}

const emitEvent = (req, event, users, data)=>{
  console.log("Emitting Event", event);
}

const deleteFilesFromCloudinary = async (public_ids) => {

}

export { connectDB, sendToken, emitEvent, cookieOption, deleteFilesFromCloudinary };

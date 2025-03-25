import express from "express";
import {
  acceptRequest,
  allUser,
  getMyFriends,
  getMyProfile,
  getNotifications,
  login,
  logout,
  searchUser,
  sendRequest,
} from "../controllers/user.controller.js";
import { newUsers } from "../controllers/user.controller.js";
import { multerUpload } from "../middlewares/multer.js";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  acceptRequestValidator,
  loginValidator,
  registerValidator,
  sendRequestValidator,
  validateHandler,
} from "../lib/validators.js";

const app = express();

app.post(
  "/new",
  multerUpload.single("avatar"),
  registerValidator(),
  validateHandler,
  newUsers
);
app.post(
  "/login",
  multerUpload.none(),
  loginValidator(),
  validateHandler,
  login
);

// Now user must login to access the routes
app.get("/me", isAuthenticated, getMyProfile);
app.get("/logout", isAuthenticated, logout);
app.get("/search", isAuthenticated, searchUser);
app.get("/notification", isAuthenticated, getNotifications);
app.get("/friends", isAuthenticated, getMyFriends);
app.get("/allUsers", isAuthenticated, allUser);
app.put(
  "/send-request",
  isAuthenticated,
  sendRequestValidator(),
  validateHandler,
  sendRequest
);
app.put(
  "/accept-request",
  isAuthenticated,
  acceptRequestValidator(),
  validateHandler,
  acceptRequest
);

export default app;

import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { errorMiddleware } from "./middlewares/error.js";
import admin from "./routes/admin.routes.js";
import chat from "./routes/chats.routes.js";
import user from "./routes/user.routes.js";
import { connectDB } from "./utils/features.js";
import { Server } from "socket.io";
import http from "http";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./constants/events.js";
import { v4 as uuid } from "uuid";
import { getSockets } from "./lib/helper.js";
import Message from "./models/message.model.js";
import cors from "cors";
import {v2 as cloudinary} from "cloudinary";

dotenv.config({
  path: "./.env",
});

connectDB(process.env.MONGO_URI);
const port = process.env.PORT || 3000;
export const envMode = process.env.NODE_ENV.trim() || "PRODUCTION";
const userSocketIDs = new Map();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:4173", process.env.CLIENT_URL, ],
  credentials: true,
}))

app.use("/api/v1/user", user);
app.use("/api/v1/chats", chat);
app.use("/api/v1/admin", admin);

app.get("/", (req, res) => {
  res.send("Hello World");
});

io.on("connection", (socket) => {
  const user = {
    _id: "dfghvjb",
    name: "rainbow",
  };
  userSocketIDs.set(user._id.toString(), socket._id); 
  console.log("User connected", socket.id);

  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageForRealtime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };
    const messageForDB = {
      content: message,
      sender: user._id,
      chat: chatId,
    }

    const usersSocket = getSockets(members);
    io.to(usersSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealtime,
    });
    io.to(usersSocket).emit(NEW_MESSAGE_ALERT, { chatId });

    // console.log("New message: ", messageForRealtime);
    try {
      await Message.create(messageForDB);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    userSocketIDs.delete(user._id.toString());
  });
});

app.use(errorMiddleware);

server.listen(port, () => {
  console.log(
    `Server is running on port ${port} in ${envMode.toLowerCase()} mode.`
  );
});


export { userSocketIDs };
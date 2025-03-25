import jwt from "jsonwebtoken";
import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { ErrorHandler } from "../utils/utility.js";

const adminLogin = async (req, res, next) => {
  try {
    const { secretKey } = req.body;

    const adminKey = process.env.ADMIN_SECRET_KEY || "anubhav-0004";
    const isMatch = secretKey.toString().trim() === adminKey.toString().trim();
    if (!isMatch) return next(new ErrorHandler("Admin secret-key is not valid.", 401));

    const token = jwt.sign({secretKey}, process.env.JWT_SECRET, { expiresIn: "30m", });

    return res
      .status(200)
      .cookie("sandesh-admin-token", token, {
        maxAge: 1000 * 60 * 30,
        sameSite: "none",
        httpOnly: true,
        secure: true,
      })
      .json({
        success: true,
        message: "Authenticated Successfully, Anubhav",
      });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const adminLogout = async (req, res, next) => {
  try {
    return res
      .status(200)
      .cookie("sandesh-admin-token", "", {
        maxAge: 0,
        sameSite: "none",
        httpOnly: true,
        secure: true,
      })
      .json({
        success: true,
        message: "Admin logged out",
      });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const getAdminData = async (req, res, next) => {
  return res.status(200).json({
    admin: true,
  });
};

const allUsers = async (req, res, next) => {
  try {
    const users = await User.find({});

    const transformedData = await Promise.all(
      users.map(async ({ name, username, avatar, _id, createdAt }) => {
        const [groups, friends] = await Promise.all([
          Chat.countDocuments({ groupChat: true, members: _id }),
          Chat.countDocuments({ groupChat: false, members: _id }),
        ]);

        return {
          name,
          username,
          avatar: avatar.url,
          _id,
          groups,
          friends,
          createdAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      transformedData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const allChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({})
      .populate("members", "name avatar")
      .populate("creator", "name avatar");

    const transformedChats = await Promise.all(
      chats.map(async ({ members, _id, groupChat, name, creator }) => {
        const totalMessages = await Message.countDocuments({ chat: _id });

        return {
          _id,
          groupChat,
          name,
          avatar: members.slice(0, 3).map((member) => member.avatar.url),
          members: members.map(({ _id, name, avatar }) => ({
            _id,
            name,
            avatar: avatar.url,
          })),
          creator: {
            name: creator?.name || "None",
            avatar: creator?.avatar.url || "",
          },
          totalMembers: members.length,
          totalMessages: totalMessages,
        };
      })
    );

    return res.status(200).json({
      success: true,
      chats: transformedChats,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const allMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({})
      .populate("sender", "name avatar")
      .populate("chat", "groupChat");

    const transformedMessages = messages.map(
      ({ content, attachments, _id, sender, createdAt, chat }) => ({
        _id,
        attachments,
        content,
        createdAt,
        chat: chat?._id,
        groupChat: chat?.groupChat,
        sender: {
          _id: sender._id,
          name: sender.name,
          avatar: sender.avatar.url,
        },
      })
    );

    return res.status(200).json({
      success: true,
      transformedMessages,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const [groupsCount, usersCount, messageCount, totalChatsCount] =
      await Promise.all([
        Chat.countDocuments({ groupChat: true }),
        User.countDocuments(),
        Message.countDocuments(),
        Chat.countDocuments(),
      ]);

    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const last7DaysMessage = await Message.find({
      createdAt: {
        $gte: last7Days,
        $lte: today,
      },
    }).select("createdAt");

    const messages = new Array(7).fill(0);
    last7DaysMessage.forEach((message) => {
      // today.getTime will give you current date and time and message.createdAt.getTime will give time and date when message created and then devide it by one day to get 7 unique index
      const indexApprx =
        (today.getTime() - message.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const index = Math.floor(indexApprx);
      // if message created one day ago then it must be on last index
      messages[6 - index]++;
    });

    const stats = {
      groupsCount,
      usersCount,
      messageCount,
      totalChatsCount,
      last7DaysMessage,
      messages,
    };

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export {
  adminLogin,
  allChats,
  allMessages,
  allUsers,
  getDashboard,
  adminLogout,
  getAdminData,
};

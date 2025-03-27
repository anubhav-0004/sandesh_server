import { compare } from "bcrypt";
import User from "../models/user.model.js";
import { emitEvent, sendToken, uploadOnCloudianry } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";
import Chat from "../models/chat.model.js";
import Request from "../models/request.model.js";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import mongoose from "mongoose";

// Create a new user and save it to the database and save in cookie
const newUsers = async (req, res, next) => {
  try {
    const { name, username, password, bio, phone, email } = req.body;
    const file = req.file;
    if (!file) return next(new ErrorHandler("Please upload avatar."));
    const result = await uploadOnCloudianry([file]);

    const avatar = {
      public_id: result[0].public_id,
      url: result[0].url,
    };

    const user = await User.create({
      name,
      username,
      password,
      avatar,
      bio,
      phone,
      email,
    });

    sendToken(res, user, 201, "User Created");
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).select("+password");
    if (!user) return next(new ErrorHandler("Invalid Username", 404));
    const isPassMatched = await compare(password, user.password);
    if (!isPassMatched) {
      return next(new ErrorHandler("Invalid Password", 404));
    }
    sendToken(res, user, 200, `Welcome Back, ${user.name}`);
  } catch (error) {
    next(error);
  }
};

const getMyProfile = async function (req, res, next) {
  try {
    const user = await User.findById(req.user);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async function (req, res, next) {
  try {
    return res
      .status(200)
      .cookie("sandesh-token", "", {
        maxAge: 0,
        sameSite: "none",
        httpOnly: true,
        secure: true,
      })
      .json({
        success: true,
        message: "LoggedOut Successfully.",
      });
  } catch (error) {
    next(error);
  }
};

const searchUser = async function (req, res, next) {
  try {
    const { name = "" } = req.query;
    //Find all the chats which are not a grp chat
    const myChats = await Chat.find({ groupChat: false, members: req.user });
    // Now get the chats in which i am a member and my friend is also a member as we sent msgs to each other
    const allUsersFromMyChats = myChats.map((chat) => chat.members).flat();
    // Find all the users whose id not engaged with me in any chat
    const allUnfriendUsers = await User.find({
      _id: { $nin: allUsersFromMyChats },
      name: { $regex: name, $options: "i" },
    });
    // we only want id name and avatar of that user
    const users = allUnfriendUsers.map(({ _id, name, avatar }) => ({
      _id,
      name,
      avatar: avatar.url,
      isfriend: false,
    }));

    for (const user of users) {
      const isRequestSent = await Request.find({
        sender: req.user,
        receiver: user._id,
      });
      if (isRequestSent.length > 0) {
        user.isfriend = true;
      }
    }

    return res.status(200).json({
      success: true,
      message: name,
      users,
    });
  } catch (error) {
    next(error);
  }
};


const sendRequest = async function (req, res, next) {
  try {
    const { userId } = req.body;

    const request = await Request.findOne({
      $or: [
        { sender: req.user, receiver: userId },
        { sender: userId, receiver: req.user },
      ],
    });

    if (request) return next(new ErrorHandler("Request already sent", 400));

    await Request.create({
      sender: req.user,
      receiver: userId,
    });

    emitEvent(req, NEW_REQUEST, [userId]);

    return res.status(200).json({
      success: true,
      message: "Friend request sent.",
    });
  } catch (error) {
    next(error);
  }
};

const acceptRequest = async function (req, res, next) {
  try {
    //based on accept it work as accept-request as well as delete-request
    const { requestId, accept, id } = req.body;
    let request;
    if (id) {
      const objId = mongoose.Types.ObjectId.createFromHexString(id);
      const reqId = mongoose.Types.ObjectId.createFromHexString(req.user);

      request = await Request.findOne({
        $or: [
          { sender: objId, receiver: reqId },
          { sender: reqId, receiver: objId },
        ],
      });
    } else {
      request = await Request.findById(requestId)
        .populate("sender", "name")
        .populate("receiver", "name");
    }

    if (!request) return next(new ErrorHandler("Request not found", 404));
    console.log(request);
    // if (request.receiver._id.toString() !== req.user.toString())
    //   return next(new ErrorHandler("Unauthorised to accept", 401));

    if (!accept) {
      await request.deleteOne();

      return res.status(200).json({
        success: true,
        message: "Friend Request rejected",
      });
    }

    const members = [request.sender._id, request.receiver._id];

    await Promise.all([
      Chat.create({
        members,
        name: `${request.sender.name.split(" ")[0]}-${request.receiver.name.split(" ")[0]}`,
      }),
      request.deleteOne(),
    ]);

    emitEvent(req, REFETCH_CHATS, members);

    return res.status(200).json({
      success: true,
      message: "Friend request accepted.",
      senderId: request.sender._id,
    });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async function (req, res, next) {
  try {
    const requests = await Request.find({ receiver: req.user }).populate(
      "sender",
      "name avatar"
    );

    const allRequest = requests.map(({ _id, sender }) => ({
      _id,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar.url,
      },
    }));
    return res.status(200).json({
      success: true,
      allRequest,
    });
  } catch (error) {
    next(error);
  }
};

const getMyFriends = async function (req, res, next) {
  try {
    const chatId = req.query.chatId;

    const chats = await Chat.find({
      members: req.user,
      groupChat: false,
    }).populate("members", "name avatar");

    const friends = chats.map(({ members }) => {
      const otherUser = getOtherMember(members, req.user);

      return {
        _id: otherUser._id,
        name: otherUser.name,
        avatar: otherUser.avatar.url,
      };
    });

    if (chatId) {
      const chat = await Chat.findById(chatId);
      const availableFriends = friends.filter(
        (friend) => !chat.members.includes(friend._id)
      );

      return res.status(200).json({
        success: true,
        friends: availableFriends,
      });
    } else {
      return res.status(200).json({
        success: true,
        friends,
      });
    }
  } catch (error) {
    next(error);
  }
};

const allUser = async (req, res, next) => {
  try {
    const users = await User.find({});

    const transformedData = await Promise.all(
      users.map(async ({ name, username, avatar, _id }) => {
        return {
          name,
          username,
          avatar: avatar.url,
          _id,
        };
      })
    );

    const filteredData = transformedData.filter(
      (item) => item._id.toString() !== req.user
    );

    return res.status(200).json({
      success: true,
      filteredData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const searchUserById = async function (req, res, next) {
  try {
    const { id } = req.query;
    const user = await User.findById(id);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export {
  login,
  newUsers,
  getMyProfile,
  logout,
  searchUser,
  sendRequest,
  acceptRequest,
  getNotifications,
  getMyFriends,
  allUser,
  searchUserById,
};

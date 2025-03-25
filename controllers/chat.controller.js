import { ErrorHandler } from "../utils/utility.js";
import Chat from "../models/chat.model.js";
import { deleteFilesFromCloudinary, emitEvent } from "../utils/features.js";
import {
  ALERT,
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

const newGroup = async function (req, res, next) {
  try {
    console.log("object");
    const { name, members } = req.body;
    if (members.length < 2)
      return next(
        new ErrorHandler("GroupChat must have atleast 3 members", 400)
      );
    const allMembers = [...members, req.user];
    await Chat.create({
      name,
      groupChat: true,
      creator: req.user,
      members: allMembers,
    });

    emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
    emitEvent(req, REFETCH_CHATS, members);

    return res.status(201).json({
      success: true,
      message: "Group Created",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getMyChats = async function (req, res, next) {
  try {
    const chats = await Chat.find({ members: req.user }).populate(
      "members",
      "name avatar"
    );

    const transformChats = chats.map(({ _id, name, members, groupChat }) => {
      const otherMember = getOtherMember(members, req.user);

      return {
        _id,
        groupChat,
        avatar: groupChat
          ? members.slice(0, 3).map(({ avatar }) => avatar.url)
          : [otherMember.avatar.url],
        name: groupChat ? name : otherMember.name,
        members: members.reduce((prev, curr) => {
          if (curr._id.toString() !== req.user.toString()) {
            prev.push(curr._id);
          }
          return prev;
        }, []),
      };
    });

    return res.status(200).json({
      success: true,
      chats: transformChats,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getMyGroups = async (req, res, next) => {
  try {
    const chats = await Chat.find({
      members: req.user,
      groupChat: true,
      creator: req.user,
    }).populate("members", "name avatar");

    const groups = chats.map(({ members, _id, name, groupChat }) => ({
      _id,
      groupChat,
      name,
      avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
    }));

    return res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const addMembers = async (req, res, next) => {
  try {
    const { chatId, members } = req.body;

    if (!members || members.length < 1)
      return next(new ErrorHandler("Please provide a member to add", 400));

    const chat = await Chat.findById(chatId);

    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    if (!chat.groupChat) return next(new ErrorHandler("Not a GroupChat", 400));

    if (chat.creator.toString() !== req.user.toString())
      return next(new ErrorHandler("You are not allowed to add members", 403));

    const allNewMemberPromise = members.map((i) => User.findById(i, "name"));

    const allNewMembers = await Promise.all(allNewMemberPromise);

    const uniqueMembers = allNewMembers.filter(
      (i) => !chat.members.includes(i._id.toString())
    );

    chat.members.push(...uniqueMembers.map((i) => i._id));

    if (chat.members.length > 50)
      return next(new ErrorHandler("Group member limit(50) reached."), 400);

    await chat.save();

    const allUsersName = allNewMembers.map((i) => i.name).join(",");

    emitEvent(
      req,
      ALERT,
      chat.members,
      `${allUsersName} has been added to group.`
    );

    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
      success: true,
      allUsersName,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const removeMembers = async function (req, res, next) {
  try {
    const { chatId, userId } = req.body;

    const [chat, userToRemove] = await Promise.all([
      Chat.findById(chatId),
      User.findById(userId),
    ]);

    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    if (!chat.groupChat)
      return nect(new ErrorHandler("It's not a group chat", 400));

    if (chat.creator.toString() !== req.user.toString())
      return next(
        new ErrorHandler("You are not allowed to remove member", 403)
      );

    if (chat.members.length <= 3)
      return next(new ErrorHandler("Group must have atleast 3 members", 400));

    if (!userToRemove)
      return next(new ErrorHandler("Please select a member to remove", 400));

    chat.members = chat.members.filter(
      (member) => member.toString() !== userId.toString()
    );

    await chat.save();

    emitEvent(
      req,
      ALERT,
      chat.members,
      `${userToRemove.name} has been removed from this group`
    );
    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
      status: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const leaveGroup = async (req, res, next) => {
  try {
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);

    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    if (!chat.groupChat)
      return next(new ErrorHandler("This is not a group chat", 400));

    if (!chat.members.includes(req.user.toString())) {
      return next(new ErrorHandler("You are not in this group", 400));
    }

    const remainingMembers = chat.members.filter(
      (member) => member.toString() !== req.user.toString()
    );

    if (remainingMembers.length < 3)
      return next(new ErrorHandler("Group must have atleast 3 members", 400));

    if (chat.creator.toString() === req.user.toString()) {
      const newCreator = remainingMembers[0];
      chat.creator = newCreator;
    }

    chat.members = remainingMembers;
    const user = await User.findById(chatId, "name");

    await chat.save();

    emitEvent(req, ALERT, chat.members, `${user} left this group.`);

    res.status(200).json({
      status: true,
      message: "You left the group",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const sendAttachments = async function (req, res, next) {
  try {
    const { chatId } = req.body;

    const files = req.files || [];
    if(files.length < 1) return next(new ErrorHandler("Please upload attachments", 400));
    if(files.length > 5) return next(new ErrorHandler("You can upload upto 5 attachments only", 400));

    const [chat, me] = await Promise.all([
      Chat.findById(chatId),
      User.findById(req.user, "name"),
    ]);

    if (!chat) return next(new ErrorHandler("Chat not found", 404));


    if (files.length < 1)
      return next(new ErrorHandler("Please upload attachments", 400));

    // Upload files here
    const attachments = [];

    const messageForRealTime = {
      content: "",
      attachments,
      sender: {
        _id: me._id,
        name: me.name,
        // avatar: me.avatar.url,
      },
      chat: chatId,
    };

    const messageForDB = {
      content: "",
      attachments,
      sender: me._id,
      chat: chatId,
    };

    const message = await Message.create(messageForDB);

    emitEvent(req, NEW_ATTACHMENT, chat.members, {
      message: messageForRealTime,
      chatId,
    });

    emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId, sender: me._id });

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("eror", error);
    next(error);
  }
};

const getChatDetails = async function (req, res, next) {
  try {
    if (req.query.populate === "true") {
      const chat = await Chat.findById(req.params.id)
        .populate("members", "name avatar")
        .lean();

      if (!chat) return next(new ErrorHandler("Chat not found", 404));

      chat.members = chat.members.map(({ _id, name, avatar }) => ({
        _id,
        name,
        avatar: avatar.url,
      }));

      return res.status(200).json({
        success: true,
        chat,
      });
    } else {
      const chat = await Chat.findById(req.params.id);

      if (!chat) return next(new ErrorHandler("Chat not found", 404));

      return res.status(200).json({
        success: true,
        chat,
      });
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const renameGroup = async (req, res, next) => {
  try {
    const chatId = req.params.id;
    const { name, bio } = req.query;
    const chat = await Chat.findById(chatId);

    if (!chat) return next(new ErrorHandler("Chat not found", 404));
    if (!chat.groupChat)
      return next(new ErrorHandler("This is not a group chat", 400));
    if (chat.creator.toString() !== req.user.toString())
      return next(new ErrorHandler("You are not allowed to rename", 403));

    chat.name = name;
    chat.bio = bio;
    await chat.save();

    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
      success: true,
      message: "Group renamed successfully",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const deleteChat = async function (req, res, next) {
  try {
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);

    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    const members = chat.members;

    if (chat.groupChat && chat.creator.toString() !== req.user.toString())
      return next(new ErrorHandler("You cann't delete the group", 403));

    if (chat.groupChat && !chat.members.includes(req.user.toString())) {
      return next(new ErrorHandler("You are not a member of this group", 403));
    }
    // Delete messages and attachments

    const messageWithAttachments = await Message.find({
      chat: chatId,
      attachments: { $exists: true, $ne: [] },
    });

    const public_ids = [];

    messageWithAttachments.forEach(({ attachments }) => {
      attachments.forEach(({ public_id }) => {
        public_ids.push(public_id);
      });
    });

    await Promise.all([
      //Delete Files From CLoudinary
      deleteFilesFromCloudinary(public_ids),
      Chat.deleteOne({_id: chatId}),
      Message.deleteMany({ chat: chatId }),
    ]);

    emitEvent(req, REFETCH_CHATS, members);

    res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const chatId = req.params.id;
    const { page = 1 } = req.query;
    const limit = 20;

    const [messages, totalMessagesCount] = await Promise.all([
      Message.find({ chat: chatId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("sender", "name avatar")
        .lean(),
      Message.countDocuments({ chat: chatId }),
    ]);

    const totalPages = Math.ceil(totalMessagesCount / limit) || 0;

    return res.status(200).json({
      success: true,
      message: messages.reverse(),
      totalPages,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export {
  newGroup,
  getMyChats,
  getMyGroups,
  addMembers,
  removeMembers,
  leaveGroup,
  sendAttachments,
  getChatDetails,
  renameGroup,
  deleteChat,
  getMessages,
};

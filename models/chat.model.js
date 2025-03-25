import mongoose from "mongoose";
const { Schema, models, model } = mongoose;

const chatSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    groupChat: {
      type: Boolean,
      default: false,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const Chat = models.Chat || model("Chat", chatSchema);
export default Chat;

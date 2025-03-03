import mongoose from "mongoose";
const { Schema, models, model } = mongoose;

const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: String,
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    attachments: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Message = models.Message || model("Message", messageSchema);
export default Message;

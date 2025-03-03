import mongoose from "mongoose";
const {Schema, models, model } = mongoose;


const requestSchema = new Schema({
    status: {
        type: String,
        default: "pending",
        enum: ["pending", "accepted", "rejected"],
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });

const Request = models.Request || model("Request", requestSchema);
export default Request;
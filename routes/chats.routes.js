import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { addMembers, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroup, removeMembers, renameGroup, sendAttachments } from "../controllers/chat.controller.js";
import { multerUpload } from "../middlewares/multer.js";
import { addMemberValidator, getMsgValidator, leaveGrpValidator, newGroupChatValidator, removeMemberValidator, sendAttachmentsValidator, validateHandler } from "../lib/validators.js";

const app = express();

app.use(isAuthenticated);
// Now user must login to access the routes
app.post("/new",newGroupChatValidator(), validateHandler, newGroup);
app.get("/my", getMyChats);
app.get("/my/groups", getMyGroups);
app.put("/addmembers",addMemberValidator(), validateHandler, addMembers);
app.put("/removemembers",removeMemberValidator(), validateHandler, removeMembers);
app.delete("/leave/:id",leaveGrpValidator(), validateHandler, leaveGroup);
app.post("/message", multerUpload.array("files", 5),sendAttachmentsValidator(), validateHandler, sendAttachments);
app.get("/message/:id",getMsgValidator(), validateHandler, getMessages);
app.route("/:id").get(getChatDetails).put(renameGroup).delete(deleteChat);
export default app;
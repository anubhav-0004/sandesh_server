import { body, check, param, validationResult } from "express-validator";
import { ErrorHandler } from "../utils/utility.js";

// Validation middleware for registration
const registerValidator = () => [
  body("name").notEmpty().withMessage("Please enter name."),
  body("username").notEmpty().withMessage("Please enter username."),
  body("password").notEmpty().withMessage("Please enter password."),
  body("bio").notEmpty().withMessage("Please enter bio."),
];

// Validation for login
const loginValidator = () => [
  body("username").notEmpty().withMessage("Please enter the username."),
  body("password").notEmpty().withMessage("Please enter password."),
];

// NewGroupChat validation
const newGroupChatValidator = () => [
  body("name").notEmpty().withMessage("Please enter the Name."),
  body("members")
    .notEmpty()
    .withMessage("Please enter Members.")
    .isArray({ min: 2, max: 100 })
    .withMessage("Members must be 2 to 100"),
];

// validation to add member
const addMemberValidator = () => [
  body("chatId").notEmpty().withMessage("Please enter chat ID"),
  body("members")
    .notEmpty()
    .withMessage("Please enter Members.")
    .isArray({ min: 1, max: 96 })
    .withMessage("Members must be 1 to 96"),
];

// validation to remove member
const removeMemberValidator = () => [
    body("chatId").notEmpty().withMessage("Please enter the chat ID"),
    body("userId").notEmpty().withMessage("Please enter the user to remove"),
];

// validator to leave group
const leaveGrpValidator = () => [
    param("id").notEmpty().withMessage("Please enter the chat ID"),
];

// send attachments validation
const sendAttachmentsValidator = () => [
    body("chatId").notEmpty().withMessage("Please enter the chat ID"),
];

// get message validator
const getMsgValidator = () => [
    param("id").notEmpty().withMessage("Please enter the chat ID"),
];

// Validation for friend request
const sendRequestValidator = () => [
    body("userId").notEmpty().withMessage("Please enter the User ID."),
  ];

//delete request validation
const deleteRequestValidator = () => [
  body("userId").notEmpty().withMessage("Please enter the User ID."),
];


// Validation to accept friend request
const acceptRequestValidator = () => [
  body("requestId").notEmpty().withMessage("Please enter request ID."),
  body("accept").notEmpty().withMessage("Please add accept").isBoolean().withMessage("Accept must be boolean"),
];


// Validation to login as admin
const adminLoginValidator = () => [
  body("secretKey").notEmpty().withMessage("Please enter admin secret key."),
];



// Validation error handler
const validateHandler = (req, res, next) => {
  const errors = validationResult(req);
  // Extract error message
  const errMsg = errors
    .array()
    .map((error) => error.msg)
    .join(", ");
  // Send a response with validation errors
  if (errors.isEmpty()) return next();
  else {
    next(new ErrorHandler(errMsg, 400));
  }
  next(new ErrorHandler(errMsg));
};

export {
  validateHandler,
  registerValidator,
  loginValidator,
  newGroupChatValidator,
  addMemberValidator,
  removeMemberValidator,
  leaveGrpValidator,
  sendAttachmentsValidator,
  getMsgValidator,
  sendRequestValidator,
  acceptRequestValidator,
  adminLoginValidator,
  deleteRequestValidator
};

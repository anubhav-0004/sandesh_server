import { hash } from "bcrypt";
import mongoose from "mongoose";
const { Schema, models, model } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if(!this.isModified("password")) return next();
  this.password = await hash(this.password, 10);
});

const User = models.User || model("User", userSchema);
export default User;

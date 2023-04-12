import mongoose from "mongoose";
const UserSchema = new mongoose.Schema(
  {
    _id: { type: String },
    email: { type: String },
    displayName: { type: String },
    photoURL: { type: String },
  },
  { timestamps: true, _id: false }
);

const User = mongoose.model("users", UserSchema);
export default User;

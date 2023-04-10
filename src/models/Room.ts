import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  user: { type: String, ref: "users" },
  nickname: { type: String, default: "" },
});
const RoomSchema = new mongoose.Schema(
  {
    _id: { type: String },
    name: { type: String, default: "" },
    isAcceptLink: { type: Boolean, default: false },
    initiator: { type: String, default: "" },
    type: { type: String, default: "Group" },
    photoURL: { type: String, default: "" },
    lastMessage: { type: String, default: null, ref: "messages" },
    users: [userSchema],
  },
  { timestamps: true, _id: false }
);
const Room = mongoose.model("rooms", RoomSchema);
export default Room;

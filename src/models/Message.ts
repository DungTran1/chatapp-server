import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
  user: { type: String, ref: "users" },
  name: { type: String },
});

const MessageSchema = new mongoose.Schema(
  {
    _id: { type: String, require: true },
    roomId: { type: String, require: true },
    text: { type: String, default: "" },
    reply: { type: String, default: null, ref: "messages" },
    type: { type: String, default: "send" },
    files: [{ type: String }],
    reaction: [reactionSchema],
    actedByUser: { type: String, ref: "users", default: null },
  },
  { timestamps: true, _id: false }
);

const Message = mongoose.model("messages", MessageSchema);
export default Message;

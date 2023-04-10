import mongoose from "mongoose";
const nicknameSchema = new mongoose.Schema(
  {
    // _id: { type: String, required: true },
    _id: { type: String, require: true },
    name: { type: String, default: "" },
  },
  { _id: false }
);

const Nickname = mongoose.model("nicknames", nicknameSchema);
export default Nickname;

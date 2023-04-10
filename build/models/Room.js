"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    user: { type: String, ref: "users" },
    nickname: { type: String, default: "" },
});
const RoomSchema = new mongoose_1.default.Schema({
    _id: { type: String },
    name: { type: String, default: "" },
    isAcceptLink: { type: Boolean, default: false },
    initiator: { type: String, default: "" },
    type: { type: String, default: "Group" },
    photoURL: { type: String, default: "" },
    lastMessage: { type: String, default: null, ref: "messages" },
    users: [userSchema],
}, { timestamps: true, _id: false });
const Room = mongoose_1.default.model("rooms", RoomSchema);
exports.default = Room;

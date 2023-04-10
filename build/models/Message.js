"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const reactionSchema = new mongoose_1.default.Schema({
    user: { type: String, ref: "users" },
    name: { type: String },
});
const MessageSchema = new mongoose_1.default.Schema({
    _id: { type: String, require: true },
    roomId: { type: String, require: true },
    text: { type: String, default: "" },
    reply: { type: String, default: null, ref: "messages" },
    type: { type: String, default: "send" },
    files: [{ type: String }],
    reaction: [reactionSchema],
    actedByUser: { type: String, ref: "users", default: null },
}, { timestamps: true, _id: false });
const Message = mongoose_1.default.model("messages", MessageSchema);
exports.default = Message;

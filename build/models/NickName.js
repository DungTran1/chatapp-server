"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const nicknameSchema = new mongoose_1.default.Schema({
    // _id: { type: String, required: true },
    _id: { type: String, require: true },
    name: { type: String, default: "" },
}, { _id: false });
const Nickname = mongoose_1.default.model("nicknames", nicknameSchema);
exports.default = Nickname;

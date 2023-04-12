"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UserSchema = new mongoose_1.default.Schema({
    _id: { type: String },
    email: { type: String },
    displayName: { type: String },
    photoURL: { type: String },
}, { timestamps: true, _id: false });
const User = mongoose_1.default.model("users", UserSchema);
exports.default = User;

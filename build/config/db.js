"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = () => {
    mongoose_1.default.set("strictQuery", false);
    mongoose_1.default.connect(process.env.DATABASE_URL);
    mongoose_1.default.connection.on("connected", () => {
        console.log("Mongo has connected succesfully");
    });
    mongoose_1.default.connection.on("reconnected", () => {
        console.log("Mongo has reconnected");
    });
    mongoose_1.default.connection.on("error", (error) => {
        console.log("Mongo connection has an error", error);
        mongoose_1.default.disconnect();
    });
    mongoose_1.default.connection.on("disconnected", () => {
        console.log("Mongo connection is disconnected");
    });
};
exports.default = connectDB;

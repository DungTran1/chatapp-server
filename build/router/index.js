"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const Room_1 = __importDefault(require("../models/Room"));
const Message_1 = __importDefault(require("../models/Message"));
const router = express_1.default.Router();
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findOne({ _id: req.body._id });
        return res.json(user);
    }
    catch (error) {
        console.log(error);
    }
}));
router.post("/signup", (req, res) => {
    try {
        const displayName = req.body.displayName;
        const _id = req.body._id;
        const photoURL = req.body.photoURL;
        const email = req.body.email;
        new User_1.default({
            _id,
            displayName,
            email,
            photoURL,
        }).save();
        return res.json({ status: true });
    }
    catch (error) {
        console.log(error);
        return res.json({ status: false });
    }
});
router.get("/getCurrentRoom/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentRoom = req.params.id;
        const room = yield Room_1.default.findOne({ _id: currentRoom })
            .populate("users.user")
            .populate({
            path: "lastMessage",
            populate: { path: "actedByUser" },
        });
        if (room) {
            return res.json(room);
        }
    }
    catch (error) {
        console.log(error);
    }
}));
router.post("/updateProfile", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uid = req.body.uid;
        const photoURL = req.body.photoURL;
        const displayName = req.body.displayName;
        if (displayName) {
            yield User_1.default.updateOne({ _id: uid }, {
                displayName: displayName,
            });
            return res.status(200).send();
        }
        if (photoURL) {
            yield User_1.default.updateOne({ _id: uid }, {
                photoURL: photoURL,
            });
            return res.status(200).send();
        }
    }
    catch (error) { }
}));
router.post("/updateRoomProfile", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.body.roomId;
        const photoURL = req.body.photoURL;
        yield Room_1.default.updateOne({ _id: roomId }, {
            photoURL: photoURL,
        });
        return res.status(200).send();
    }
    catch (error) { }
}));
router.get("/getUsers/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let count = Number(req.params.id);
        const currentUserId = req.query.currentUserId;
        const countUser = yield User_1.default.find({ _id: { $ne: currentUserId } }).count();
        const users = yield User_1.default.find({ _id: { $ne: currentUserId } })
            .skip(count === 1 ? 0 : count * 20 - 20)
            .limit(20);
        return res.json({
            status: true,
            users: users,
            total_results: Math.ceil(countUser / 20),
        });
    }
    catch (error) {
        console.log(error);
    }
}));
router.get("/getUsersToRoom/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let count = Number(req.params.id);
        const usersInCurrentRoom = req.query.usersInCurrentRoom;
        const countUser = yield User_1.default.find({
            _id: { $nin: JSON.parse(usersInCurrentRoom) },
        }).count();
        const users = yield User_1.default.find({
            _id: { $nin: JSON.parse(usersInCurrentRoom) },
        })
            .skip(count === 1 ? 0 : count * 20 - 20)
            .limit(20);
        return res.json({
            status: true,
            users: users,
            total_results: Math.ceil(countUser / 20),
        });
    }
    catch (error) {
        console.log(error);
    }
}));
router.get("/getRooms/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let userId = req.params.id;
        const room = yield Room_1.default.find({ "users.user": userId })
            .populate({
            path: "lastMessage",
            populate: { path: "actedByUser" },
        })
            .populate("users.user")
            .populate("users.nickname");
        return res.json({ room });
    }
    catch (error) {
        console.log(error);
    }
}));
router.get("/getMessage/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        const page = Number(req.query.page);
        const skipWhileNewMessage = Number(req.query.skipWhileNewMessage);
        const countUser = yield Message_1.default.find({ roomId }).count();
        const messages = yield Message_1.default.find({ roomId })
            .populate("actedByUser", "displayName photoURL email")
            .populate("reply")
            .skip(page === 1
            ? 0 + skipWhileNewMessage
            : page * 10 - 10 + skipWhileNewMessage)
            .limit(10)
            .sort({ createdAt: -1 });
        return res.json({
            status: true,
            messages,
            total_results: Math.ceil(countUser / 10),
        });
    }
    catch (error) {
        console.log(error);
    }
}));
router.get("/getUserOfCurrentRoom/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        const users = yield Room_1.default.findOne({ _id: roomId }).populate("users.user", "displayName photoURL email");
        return res.json(users === null || users === void 0 ? void 0 : users.users);
    }
    catch (error) {
        console.log(error);
    }
}));
router.get("/isAcceptLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.query.userId;
        const roomId = req.query.roomId;
        const room = yield Room_1.default.findOne({
            _id: roomId,
        });
        const userExist = (room === null || room === void 0 ? void 0 : room.users.find((u) => u.user === userId)) ? true : false;
        const isAcceptLink = (room === null || room === void 0 ? void 0 : room.isAcceptLink) ? true : false;
        return res.json({ userExist, isAcceptLink });
    }
    catch (error) {
        console.log(error);
    }
}));
router.post("/updateAcceptLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuccess = yield Room_1.default.updateOne({ _id: req.body.roomId }, { isAcceptLink: req.body.isAccept });
        if (isSuccess) {
            return res.sendStatus(200);
        }
    }
    catch (error) {
        console.log(error);
    }
}));
router.get("/searchUser", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchValue = req.query.searchValue;
        const userSkip = req.query.userSkip;
        const search = yield User_1.default.find({
            displayName: { $regex: searchValue },
            _id: { $nin: JSON.parse(userSkip) },
        });
        return res.json({ search });
    }
    catch (error) {
        console.log(error);
    }
}));
router.get("/getListUserReaction/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        const messageId = req.query.messageId;
        const mess = yield Message_1.default.findOne({
            roomId: roomId,
            _id: messageId,
        }).populate("reaction.user");
        if (mess) {
            return res.json({ reaction: mess.reaction });
        }
        return;
    }
    catch (error) {
        console.log(error);
    }
}));
router.get("/getMedia/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        const mess = yield Message_1.default.find({
            roomId: roomId,
            type: { $ne: "Revocation" },
        });
        const files = mess.map((file) => file.files);
        let media = [];
        for (let i = 0; i < files.length; i++) {
            for (let j = 0; j < files[i].length; j++) {
                media.push(files[i][j]);
            }
        }
        if (media.length > 0) {
            return res.json({ files: media });
        }
        return;
    }
    catch (error) {
        console.log(error);
    }
}));
router.get("/delete", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // await User.deleteMany({});
    yield Room_1.default.deleteMany({});
    yield Message_1.default.deleteMany({});
    return res.send(true);
}));
exports.default = router;

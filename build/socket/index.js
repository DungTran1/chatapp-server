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
const socket_io_1 = require("socket.io");
const Room_1 = __importDefault(require("../models/Room"));
const Message_1 = __importDefault(require("../models/Message"));
const uuid_1 = require("uuid");
const roomEmit = ({ _id, name, isAcceptLink = false, initiator, type = "Group", photoURL = "", lastMessage, users, }) => {
    return {
        _id,
        name,
        isAcceptLink,
        initiator,
        type,
        photoURL,
        lastMessage,
        users,
    };
};
const messEmit = ({ _id, roomId, text = "", type, reply, files = [], reaction = [], actedByUser = null, createdAt = new Date(), }) => {
    return {
        _id,
        roomId,
        text,
        type,
        files,
        reply,
        reaction,
        actedByUser,
        createdAt,
    };
};
let userOnline = [];
const SocketConnect = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CLIENT_DOMAIN,
            credentials: true,
        },
    });
    const connection = (socket) => {
        console.log("connection on " + socket.id);
        socket.on("user_online", (data) => {
            if (data.userId &&
                !userOnline.some((user) => Object.values(user)[0] === data.userId)) {
                userOnline.push({ [socket.id]: data.userId });
                console.log(userOnline.map((user) => Object.values(user)[0]));
                io.emit("receive_user_online", {
                    userOnline: userOnline.map((user) => Object.values(user)[0]),
                });
            }
        });
        socket.on("create_room", (data) => __awaiter(void 0, void 0, void 0, function* () {
            const _idRoom = (0, uuid_1.v4)();
            const message = data.usersAdded.map((user, index) => {
                const _idMess = (0, uuid_1.v4)();
                return {
                    _id: _idMess,
                    text: `đã thêm ${user.displayName}`,
                    type: "Notification",
                    actedByUser: data.initiator._id,
                    roomId: _idRoom,
                };
            });
            const lastMessage = message[message.length - 1];
            const room = roomEmit({
                _id: _idRoom,
                name: data.initiator.displayName,
                initiator: data.initiator._id,
                users: [
                    { user: data.initiator, nickname: null },
                    ...data.usersAdded.map((user) => ({
                        user,
                        nickname: null,
                    })),
                ],
                lastMessage: messEmit(Object.assign(Object.assign({}, lastMessage), { actedByUser: data.initiator })),
            });
            io.emit("receive_created_room", {
                status: true,
                room,
            });
            yield Room_1.default.create(Object.assign(Object.assign({}, room), { users: [
                    { user: data.initiator._id, nickname: "" },
                    ...data.usersAdded.map((user) => ({
                        user: user._id,
                        nickname: "",
                    })),
                ], lastMessage: lastMessage._id }));
            yield Message_1.default.insertMany(message);
        }));
        socket.on("create_room_with_private", (data) => __awaiter(void 0, void 0, void 0, function* () {
            const _idRoom = (0, uuid_1.v4)();
            const _idMess = (0, uuid_1.v4)();
            const date = new Date();
            const message = `Bắt đầu đoạn chat ${date.getHours()}:${date.getMinutes()}`;
            const exist = yield Room_1.default.findOne({
                type: "private",
                initiator: data.currentUser._id,
            });
            if (exist) {
                return;
            }
            io.emit("receive_created_room", {
                status: true,
                room: roomEmit({
                    _id: _idRoom,
                    name: "",
                    initiator: data.currentUser._id,
                    type: "Private",
                    photoURL: data.photoURL,
                    lastMessage: messEmit({
                        _id: _idMess,
                        roomId: data.roomId,
                        text: message,
                        type: "Notification",
                        actedByUser: null,
                    }),
                    users: [
                        { user: data.currentUser, nickname: null },
                        { user: data.privateChatInviting, nickname: null },
                    ],
                }),
            });
            yield Message_1.default.create({
                _id: _idMess,
                type: "Notification",
                roomId: _idRoom,
                text: message,
            });
            yield Room_1.default.create({
                _id: _idRoom,
                name: "",
                type: "Private",
                initiator: data.currentUser._id,
                users: [
                    { user: data.currentUser._id },
                    { user: data.privateChatInviting._id },
                ],
                lastMessage: _idMess,
                photoRoomURL: data.photoRoomURL,
            });
        }));
        socket.on("appoitment_as_administrator", (data) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const _idMessage = (0, uuid_1.v4)();
            const mess = {
                _id: _idMessage,
                roomId: data.roomId,
                text: `đã chỉ định ${data.userIsAppoitment.nickname ||
                    ((_a = data.userIsAppoitment.user) === null || _a === void 0 ? void 0 : _a.displayName)} làm quản trị viên`,
                type: "Notification",
                actedByUser: data.admin.user,
            };
            const message = messEmit(mess);
            io.in(data.roomId).emit("receive_send_message", {
                message,
            });
            io.emit("receive_last_message", {
                lastMessage: message,
            });
            yield Message_1.default.create(Object.assign(Object.assign({}, message), { actedByUser: (_b = data.admin.user) === null || _b === void 0 ? void 0 : _b._id }));
            yield Room_1.default.updateOne({ _id: data.roomId }, {
                initiator: (_c = data.userIsAppoitment.user) === null || _c === void 0 ? void 0 : _c._id,
                lastMessage: _idMessage,
            });
            io.emit("receive_reset_room", "");
        }));
        socket.on("add_user", (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const users = data.userAdded.map((e) => ({
                    user: e._id,
                    nickname: "",
                }));
                const message = () => {
                    let newMess = [];
                    for (const i of data.userAdded) {
                        const _idMess = (0, uuid_1.v4)();
                        const messAdd = messEmit({
                            _id: _idMess,
                            text: `đã thêm ${i.displayName}`,
                            roomId: data.roomId,
                            type: "Notification",
                            actedByUser: data.userAdd._id,
                        });
                        io.in(data.roomId).emit("receive_send_message", {
                            message: Object.assign(Object.assign({}, messAdd), { actedByUser: data.userAdd }),
                        });
                        newMess.push(messAdd);
                    }
                    io.emit("receive_last_message", {
                        lastMessage: Object.assign(Object.assign({}, newMess[newMess.length - 1]), { actedByUser: data.userAdd }),
                    });
                    return newMess;
                };
                const messageArr = message();
                yield Message_1.default.insertMany(messageArr);
                yield Room_1.default.updateOne({ _id: data.roomId }, {
                    $push: { users: { $each: users } },
                    lastMessage: messageArr[messageArr.length - 1]._id,
                });
                io.emit("receive_reset_room", "");
            }
            catch (error) {
                console.log(error);
            }
        }));
        socket.on("connect_to_room", (data) => __awaiter(void 0, void 0, void 0, function* () {
            if (data.oldRoom)
                socket.leave(data.oldRoom);
            if (data.newRoom)
                socket.join(data.newRoom);
        }));
        socket.on("send_message", (data) => __awaiter(void 0, void 0, void 0, function* () {
            var _d;
            try {
                console.log(data.roomId);
                const _id = (0, uuid_1.v4)();
                const message = messEmit({
                    _id,
                    roomId: data.roomId,
                    text: data.message,
                    type: "Sending",
                    reply: data.reply || null,
                    files: data.files,
                    actedByUser: Object.assign({}, data.user),
                });
                io.in(data.roomId).emit("receive_send_message", {
                    message,
                });
                io.emit("receive_last_message", {
                    lastMessage: message,
                });
                yield Room_1.default.updateOne({ _id: data.roomId }, { lastMessage: _id });
                yield Message_1.default.create(Object.assign(Object.assign({}, message), { reply: ((_d = data.reply) === null || _d === void 0 ? void 0 : _d._id) || null, actedByUser: data.user._id }));
            }
            catch (error) {
                console.log(error);
            }
        }));
        socket.on("revoke_message", (data) => __awaiter(void 0, void 0, void 0, function* () {
            var _e;
            try {
                io.in(data.roomId).emit("receive_revoke_message", {
                    type: data.type,
                    messageId: data.messageId,
                });
                if (data.type === "Revocation") {
                    if (data.lastMessage) {
                        io.emit("receive_last_message", {
                            lastMessage: Object.assign(Object.assign({}, data.lastMessage), { text: "đã thu hồi một tin nhắn", type: "Revocation", actedByUser: data.userRevoke }),
                        });
                        yield Room_1.default.updateOne({
                            _id: data.roomId,
                            lastMessage: (_e = data.lastMessage) === null || _e === void 0 ? void 0 : _e._id,
                        });
                    }
                }
                yield Message_1.default.updateOne({ _id: data.messageId }, { type: data.type, text: "đã thu hồi một tin nhắn" });
            }
            catch (error) {
                console.log(error);
            }
        }));
        socket.on("remove_user_from_room", (data) => __awaiter(void 0, void 0, void 0, function* () {
            var _f, _g;
            const _id = (0, uuid_1.v4)();
            const userRemoved = data.userRemoved;
            const message = messEmit({
                _id,
                roomId: data.roomId,
                text: `đã xóa ${userRemoved.nickname
                    ? userRemoved.nickname
                    : (_f = userRemoved.user) === null || _f === void 0 ? void 0 : _f.displayName} khỏi phòng chat`,
                actedByUser: data.admin,
                type: "Notification",
            });
            io.in(data.roomId).emit("receive_send_message", {
                message: message,
            });
            io.emit("receive_last_message", {
                lastMessage: message,
            });
            yield Message_1.default.create(Object.assign(Object.assign({}, message), { actedByUser: data.admin._id }));
            yield Room_1.default.updateOne({ _id: data.roomId }, {
                $pull: { users: { user: (_g = userRemoved.user) === null || _g === void 0 ? void 0 : _g._id } },
                lastMessage: _id,
            });
            const userClientOnline = userOnline.find((u) => { var _a; return ((_a = userRemoved.user) === null || _a === void 0 ? void 0 : _a._id) === Object.values(u)[0]; });
            if (!userClientOnline) {
                io.emit("receive_reset_room", "");
                return;
            }
            const clientId = Object.keys(userClientOnline)[0];
            io.except(clientId).emit("receive_reset_room", "");
            io.to(clientId).emit("receive_reset_room", data.roomId);
        }));
        socket.on("leave_room", (data) => __awaiter(void 0, void 0, void 0, function* () {
            var _h, _j;
            const _id = (0, uuid_1.v4)();
            const userLeave = data.userLeave;
            const message = messEmit({
                _id,
                text: `đã rời khỏi phòng`,
                type: "Notification",
                roomId: data.roomId,
                actedByUser: userLeave.user,
            });
            socket.leave(data.roomId);
            io.in(data.roomId).emit("receive_send_message", {
                message,
            });
            io.emit("receive_last_message", {
                lastMessage: message,
            });
            yield Message_1.default.create(Object.assign(Object.assign({}, message), { actedByUser: (_h = data.userLeave.user) === null || _h === void 0 ? void 0 : _h._id }));
            yield Room_1.default.updateOne({ _id: data.roomId }, { lastMessage: _id, $pull: { users: { user: (_j = userLeave.user) === null || _j === void 0 ? void 0 : _j._id } } });
            socket.emit("receive_reset_room", data.roomId);
            socket.in(data.roomId).emit("receive_reset_room", "");
        }));
        socket.on("delete_chat_group_room", (data) => __awaiter(void 0, void 0, void 0, function* () {
            io.emit("receive_reset_room", data.roomId);
            yield Room_1.default.deleteOne({ _id: data.roomId });
            yield Message_1.default.deleteMany({ roomId: data.roomId });
        }));
        socket.on("typing", (data) => {
            io.in(data.roomId).emit("receive_typing", {
                roomId: data.roomId,
                status: data.status,
                user: data.user,
            });
        });
        socket.on("send_reaction", (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                io.in(data.roomId).emit("receive_send_reaction", data);
                const check = yield Message_1.default.findOne({
                    _id: data.messageId,
                    roomId: data.roomId,
                });
                const checkReaction = check === null || check === void 0 ? void 0 : check.reaction.find((e) => e.user === data.user._id);
                if (checkReaction) {
                    const checkDuplicate = checkReaction.name === data.name;
                    if (checkDuplicate) {
                        return;
                    }
                    yield Message_1.default.updateOne({
                        _id: data.messageId,
                        "reaction.user": data.user._id,
                    }, {
                        $set: {
                            "reaction.$.name": data.name,
                        },
                    });
                    return;
                }
                yield Message_1.default.updateOne({
                    _id: data.messageId,
                    roomId: data.roomId,
                }, {
                    $push: {
                        reaction: {
                            name: data.name,
                            user: data.user._id,
                        },
                    },
                });
            }
            catch (error) {
                console.log(error);
            }
        }));
        socket.on("change_nickname", (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const _id = (0, uuid_1.v4)();
                const message = messEmit({
                    _id,
                    text: `đã đổi biệt danh của ${data.userIsSet.displayName} thành ${data.newNickname}`,
                    roomId: data.roomId,
                    actedByUser: data.userSet,
                    type: "Notification",
                });
                io.in(data.roomId).emit("receive_send_message", {
                    message: message,
                });
                io.emit("receive_last_message", {
                    lastMessage: message,
                });
                yield Room_1.default.updateOne({ _id: data.roomId, "users.user": data.userIsSet._id }, { $set: { lastMessage: _id, "users.$.nickname": data.newNickname } });
                yield Message_1.default.create(Object.assign(Object.assign({}, message), { actedByUser: data.userSet._id }));
                io.emit("receive_reset_room", "");
            }
            catch (error) {
                console.log(error);
            }
        }));
        socket.on("change_room_name", (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const _id = (0, uuid_1.v4)();
                const message = messEmit({
                    _id,
                    text: `đã đổi tên đoạn chat là ${data.newRoomName}`,
                    roomId: data.roomId,
                    actedByUser: data.userSet,
                    type: "Notification",
                });
                io.in(data.roomId).emit("receive_send_message", {
                    message,
                });
                io.emit("receive_last_message", {
                    lastMessage: message,
                });
                yield Room_1.default.updateOne({ _id: data.roomId }, { name: data.newRoomName, lastMessage: _id });
                yield Message_1.default.create(Object.assign(Object.assign({}, message), { actedByUser: data.userSet._id }));
                io.emit("receive_reset_room", "");
            }
            catch (error) {
                console.log(error);
            }
        }));
        socket.on("join_room_with_link", (data) => __awaiter(void 0, void 0, void 0, function* () {
            const _id = (0, uuid_1.v4)();
            const userExist = yield Room_1.default.findOne({
                _id: data.roomId,
                users: { $elemMatch: { user: data.userJoin._id } },
            });
            if (userExist)
                return;
            const message = {
                message: messEmit({
                    _id,
                    roomId: data.roomId,
                    text: "đã tham gia",
                    type: "Notification",
                    actedByUser: data.userJoin,
                }),
            };
            socket.join(data.roomId);
            io.in(data.roomId).emit("receive_send_message", Object.assign({}, message));
            io.emit("receive_last_message", {
                lastMessage: message.message,
            });
            yield Room_1.default.updateOne({ _id: data.roomId }, {
                $push: { users: { user: data.userJoin._id } },
                lastMessage: _id,
            });
            yield Message_1.default.create(Object.assign(Object.assign({}, message), { actedByUser: data.userJoin._id }));
            io.emit("receive_reset_room", "");
        }));
        socket.on("disconnect", (reason) => {
            userOnline = userOnline.filter((user) => Object.keys(user)[0] !== socket.id);
            io.emit("receive_user_online", {
                userOnline: userOnline.map((user) => Object.values(user)[0]),
            });
            console.log("DISCONNESSO!!! ", reason);
            socket.disconnect();
        });
    };
    io.on("connection", connection);
    io.on("disconnect", (socket) => {
        io.disconnectSockets();
        console.log("disconnect at  " + socket);
    });
};
exports.default = SocketConnect;

import { Server, Socket } from "socket.io";
import RoomModel from "../models/Room";
import UserModel from "../models/User";
import MessageModel from "../models/Message";
import { v4 as uuidv4 } from "uuid";
import { Message, User, UserInRoom } from "../service/type";
type messEmittype = {
  _id: string;
  roomId: string;
  text: string;
  type: string;
  reply?: string;
  files?: string[];
  reaction?: User[];
  actedByUser: string | User | null;
  createdAt?: Date;
};
type roomEmitType = {
  _id: string;
  name?: string;
  isAcceptLink?: boolean;
  initiator: string;
  type?: string;
  photoURL?: string;
  lastMessage: string | messEmittype;
  users: string | UserInRoom[];
};
type roomEmitFunction = (room: roomEmitType) => roomEmitType;
type messEmitFunction = (mess: messEmittype) => messEmittype;
const roomEmit: roomEmitFunction = ({
  _id,
  name = "",
  isAcceptLink = false,
  initiator,
  type = "Group",
  photoURL = "",
  lastMessage,
  users,
}) => {
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
const messEmit: messEmitFunction = ({
  _id,
  roomId,
  text = "",
  type,
  reply,
  files = [],
  reaction = [],
  actedByUser = null,
  createdAt = new Date(),
}) => {
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

let userOnline: { [key: string]: string }[] = [];
const SocketConnect = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_DOMAIN,
      credentials: true,
    },
  });
  const connection = (socket: Socket) => {
    console.log("connection on " + socket.id);
    socket.on("user_online", (data: { userId: string }) => {
      if (
        data.userId &&
        !userOnline.some((user) => Object.values(user)[0] === data.userId)
      ) {
        userOnline.push({ [socket.id]: data.userId });
        console.log(userOnline.map((user) => Object.values(user)[0]));
        io.emit("receive_user_online", {
          userOnline: userOnline.map((user) => Object.values(user)[0]),
        });
      }
    });
    socket.on(
      "subscribe_room",
      async (data: { newRoom: string; oldRoom: string }) => {
        if (data.oldRoom) socket.leave(data.oldRoom);
        if (data.newRoom) socket.join(data.newRoom);
      }
    );
    socket.on(
      "create_room",
      async (data: {
        initiator: User;
        usersAdded: User[];
        photoURL: string;
      }) => {
        const _idRoom = uuidv4();
        const message = data.usersAdded.map((user, index) => {
          const _idMess = uuidv4();
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
          name: data.initiator.displayName as string,
          initiator: data.initiator._id,
          users: [
            { user: data.initiator, nickname: "" },
            ...(data.usersAdded.map((user) => ({
              user,
              nickname: "",
            })) as UserInRoom[]),
          ],
          lastMessage: messEmit({
            ...lastMessage,
            actedByUser: data.initiator,
          }),
        });
        io.emit("receive_created_room", {
          status: true,
          room,
        });
        await RoomModel.create({
          ...room,
          users: [
            { user: data.initiator._id, nickname: "" },
            ...data.usersAdded.map((user) => ({
              user: user._id,
              nickname: "",
            })),
          ],
          lastMessage: lastMessage._id,
        });
        await MessageModel.insertMany(message);
        io.emit("receive_reset_room", "");
      }
    );
    socket.on(
      "create_room_with_private",
      async (data: { UserStartChat: User; UserChatWith: User }) => {
        const _idRoom = uuidv4();
        const _idMess = uuidv4();
        const date = new Date();
        const message = `Bắt đầu đoạn chat ${date.getHours()}:${date.getMinutes()}`;
        const exist = await RoomModel.findOne({
          type: "Private",
          "users.user": {
            $all: [data.UserStartChat._id, data.UserChatWith._id],
          },
        });
        if (exist) {
          return;
        }
        io.emit("receive_created_room", {
          status: true,
          room: roomEmit({
            _id: _idRoom,
            initiator: data.UserStartChat._id,
            type: "Private",
            lastMessage: messEmit({
              _id: _idMess,
              roomId: _idRoom,
              text: message,
              type: "Notification",
              actedByUser: null,
            }),
            users: [
              { user: data.UserStartChat, nickname: "" },
              { user: data.UserChatWith, nickname: "" },
            ],
          }),
        });
        await MessageModel.create({
          _id: _idMess,
          type: "Notification",
          roomId: _idRoom,
          text: message,
        });
        await RoomModel.create({
          _id: _idRoom,
          name: "",
          type: "Private",
          initiator: data.UserStartChat._id,
          users: [
            { user: data.UserStartChat._id },
            { user: data.UserChatWith._id },
          ],
          lastMessage: _idMess,
        });
      }
    );
    socket.on(
      "appoitment_as_administrator",
      async (data: {
        roomId: string;
        userIsAppoitment: UserInRoom;
        admin: UserInRoom;
      }) => {
        const _idMessage = uuidv4();
        const mess = {
          _id: _idMessage,
          roomId: data.roomId,
          text: `đã chỉ định ${
            data.userIsAppoitment.nickname ||
            data.userIsAppoitment.user?.displayName
          } làm quản trị viên`,
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
        await MessageModel.create({
          ...message,
          actedByUser: data.admin.user?._id,
        });
        await RoomModel.updateOne(
          { _id: data.roomId },
          {
            initiator: data.userIsAppoitment.user?._id,
            lastMessage: _idMessage,
          }
        );
        io.emit("receive_reset_room", "");
      }
    );
    socket.on(
      "add_user",
      async (data: { roomId: string; userAdd: User; userAdded: User[] }) => {
        try {
          const users = data.userAdded.map((e) => ({
            user: e._id,
            nickname: "",
          }));
          const message = () => {
            let newMess = [];
            for (const i of data.userAdded) {
              const _idMess = uuidv4();
              const messAdd = messEmit({
                _id: _idMess,
                text: `đã thêm ${i.displayName}`,
                roomId: data.roomId,
                type: "Notification",
                actedByUser: data.userAdd._id,
              });
              io.in(data.roomId).emit("receive_send_message", {
                message: { ...messAdd, actedByUser: data.userAdd },
              });
              newMess.push(messAdd);
            }
            io.emit("receive_last_message", {
              lastMessage: {
                ...newMess[newMess.length - 1],
                actedByUser: data.userAdd,
              },
            });
            return newMess;
          };

          const messageArr = message();
          await MessageModel.insertMany(messageArr);
          await RoomModel.updateOne(
            { _id: data.roomId },
            {
              $push: { users: { $each: users } },
              lastMessage: messageArr[messageArr.length - 1]._id,
            }
          );
          io.emit("receive_reset_room", "");
        } catch (error) {
          console.log(error);
        }
      }
    );
    socket.on("send_message", async (data) => {
      try {
        const _id = uuidv4();
        const message = messEmit({
          _id,
          roomId: data.roomId,
          text: data.message,
          type: "Sending",
          reply: data.reply || null,
          files: data.files,
          actedByUser: { ...data.user },
        });
        io.in(data.roomId).emit("receive_send_message", {
          message,
        });
        io.emit("receive_last_message", {
          lastMessage: message,
        });
        await RoomModel.updateOne({ _id: data.roomId }, { lastMessage: _id });
        await MessageModel.create({
          ...message,
          reply: data.reply?._id || null,
          actedByUser: data.user._id,
        });
      } catch (error) {
        console.log(error);
      }
    });
    socket.on(
      "revoke_message",
      async (data: {
        userRevoke: User;
        messageId: string;
        type: "Revocation";
        roomId: string;
        lastMessage: Message | null;
      }) => {
        try {
          if (data.type === "Revocation") {
            io.in(data.roomId).emit("receive_revoke_message", {
              type: data.type,
              messageId: data.messageId,
            });
            if (data.lastMessage) {
              io.emit("receive_last_message", {
                lastMessage: {
                  ...data.lastMessage,
                  text: "đã thu hồi một tin nhắn",
                  type: "Revocation",
                  actedByUser: data.userRevoke,
                },
              });
              await RoomModel.updateOne(
                {
                  _id: data.roomId,
                },
                { lastMessage: data.lastMessage._id }
              );
            }
            await MessageModel.updateOne(
              { _id: data.messageId },
              {
                type: "Revocation",
                text: "đã thu hồi một tin nhắn",
                actedByUser: data.userRevoke._id,
              }
            );
          }
        } catch (error) {
          console.log(error);
        }
      }
    );
    socket.on(
      "remove_user_from_room",
      async (data: {
        admin: User;
        userRemoved: UserInRoom;
        roomId: string;
      }) => {
        const _id = uuidv4();
        const userRemoved = data.userRemoved;
        const message = messEmit({
          _id,
          roomId: data.roomId,
          text: `đã xóa ${
            userRemoved.nickname
              ? userRemoved.nickname
              : userRemoved.user?.displayName
          } khỏi phòng chat`,
          actedByUser: data.admin,
          type: "Notification",
        });
        io.in(data.roomId).emit("receive_send_message", {
          message: message,
        });
        io.emit("receive_last_message", {
          lastMessage: message,
        });
        await MessageModel.create({ ...message, actedByUser: data.admin._id });
        await RoomModel.updateOne(
          { _id: data.roomId },
          {
            $pull: { users: { user: userRemoved.user?._id } },
            lastMessage: _id,
          }
        );
        const userClientOnline = userOnline.find(
          (u) => userRemoved.user?._id === Object.values(u)[0]
        );
        if (!userClientOnline) {
          io.emit("receive_reset_room", "");
          return;
        }
        const clientId = Object.keys(userClientOnline)[0];
        io.except(clientId).emit("receive_reset_room", "");
        io.to(clientId).emit("receive_reset_room", data.roomId);
      }
    );
    socket.on(
      "leave_room",
      async (data: { userLeave: UserInRoom; roomId: string }) => {
        const _id = uuidv4();
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

        await MessageModel.create({
          ...message,
          actedByUser: data.userLeave.user?._id,
        });
        await RoomModel.updateOne(
          { _id: data.roomId },
          { lastMessage: _id, $pull: { users: { user: userLeave.user?._id } } }
        );
        socket.emit("receive_reset_room", data.roomId);
        socket.in(data.roomId).emit("receive_reset_room", "");
      }
    );
    socket.on("delete_chat_group_room", async (data: { roomId: string }) => {
      io.emit("receive_reset_room", data.roomId);
      await RoomModel.deleteOne({ _id: data.roomId });
      await MessageModel.deleteMany({ roomId: data.roomId });
    });
    socket.on("typing", (data) => {
      io.in(data.roomId).emit("receive_typing", {
        roomId: data.roomId,
        status: data.status,
        user: data.user,
      });
    });
    socket.on(
      "send_reaction",
      async (data: {
        user: User;
        name: string;
        messageId: string;
        roomId: string;
      }) => {
        try {
          io.in(data.roomId).emit("receive_send_reaction", data);
          const check = await MessageModel.findOne({
            _id: data.messageId,
            roomId: data.roomId,
          });
          const checkReaction = check?.reaction.find(
            (e) => e.user === data.user._id
          );
          if (checkReaction) {
            const checkDuplicate = checkReaction.name === data.name;

            if (checkDuplicate) {
              return;
            }
            await MessageModel.updateOne(
              {
                _id: data.messageId,
                "reaction.user": data.user._id,
              },
              {
                $set: {
                  "reaction.$.name": data.name,
                },
              }
            );
            return;
          }
          await MessageModel.updateOne(
            {
              _id: data.messageId,
              roomId: data.roomId,
            },
            {
              $push: {
                reaction: {
                  name: data.name,
                  user: data.user._id,
                },
              },
            }
          );
        } catch (error) {
          console.log(error);
        }
      }
    );
    socket.on(
      "change_nickname",
      async (data: {
        roomId: string;
        userSet: User;
        userIsSet: User;
        newNickname: string;
      }) => {
        try {
          const _id = uuidv4();
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
          await RoomModel.updateOne(
            { _id: data.roomId, "users.user": data.userIsSet._id },
            { $set: { lastMessage: _id, "users.$.nickname": data.newNickname } }
          );
          await MessageModel.create({
            ...message,
            actedByUser: data.userSet._id,
          });
          io.emit("receive_reset_room", "");
        } catch (error) {
          console.log(error);
        }
      }
    );
    socket.on(
      "change_room_name",
      async (data: { newRoomName: string; roomId: string; userSet: User }) => {
        try {
          const _id = uuidv4();
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
          await RoomModel.updateOne(
            { _id: data.roomId },
            { name: data.newRoomName, lastMessage: _id }
          );
          await MessageModel.create({
            ...message,
            actedByUser: data.userSet._id,
          });
          io.emit("receive_reset_room", "");
        } catch (error) {
          console.log(error);
        }
      }
    );
    socket.on(
      "join_room_with_link",
      async (data: { userJoin: User; roomId: string }) => {
        socket.join(data.roomId);
        const _id = uuidv4();
        const userExist = await RoomModel.findOne({
          _id: data.roomId,
          users: { $elemMatch: { user: data.userJoin._id } },
        });

        if (userExist) return;
        const message = {
          message: messEmit({
            _id,
            roomId: data.roomId,
            text: "đã tham gia",
            type: "Notification",
            actedByUser: data.userJoin,
          }),
        };

        io.in(data.roomId).emit("receive_send_message", {
          ...message,
        });

        io.emit("receive_last_message", {
          lastMessage: message.message,
        });
        await RoomModel.updateOne(
          { _id: data.roomId },
          {
            $push: { users: { user: data.userJoin._id } },
            lastMessage: _id,
          }
        );
        await MessageModel.create({
          ...message,
          actedByUser: data.userJoin._id,
        });
        io.emit("receive_reset_room", "");
      }
    );
    socket.on("disconnect", (reason) => {
      userOnline = userOnline.filter(
        (user) => Object.keys(user)[0] !== socket.id
      );
      io.emit("receive_user_online", {
        userOnline: userOnline.map((user) => Object.values(user)[0]),
      });
      console.log("DISCONNESSO!!! ", reason);
      socket.disconnect();
    });
  };
  io.on("connection", connection);
};
export default SocketConnect;

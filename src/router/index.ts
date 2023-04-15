import express from "express";
import User from "../models/User";
import Room from "../models/Room";
import Message from "../models/Message";

const router = express.Router();

router.post("/signin", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body._id });

    return res.json(user);
  } catch (error) {
    console.log(error);
  }
});
router.post("/signup", (req, res) => {
  try {
    const displayName = req.body.displayName;
    const _id = req.body._id;
    const photoURL = req.body.photoURL;
    const email = req.body.email;
    new User({
      _id,
      displayName,
      email,
      photoURL,
    }).save();
    return res.json({ status: true });
  } catch (error) {
    console.log(error);
    return res.json({ status: false });
  }
});
router.get("/getCurrentRoom/:id", async (req, res) => {
  try {
    const currentRoom = req.params.id;
    const room = await Room.findOne({ _id: currentRoom })
      .populate("users.user")
      .populate({
        path: "lastMessage",
        populate: { path: "actedByUser" },
      });
    if (room) {
      return res.json(room);
    }
  } catch (error) {
    console.log(error);
  }
});
router.post("/updateProfile", async (req, res) => {
  try {
    const uid = req.body.uid;
    const photoURL = req.body.photoURL;
    const displayName = req.body.displayName;
    if (displayName) {
      await User.updateOne(
        { _id: uid },
        {
          displayName: displayName,
        }
      );
      return res.status(200).send();
    }
    if (photoURL) {
      await User.updateOne(
        { _id: uid },
        {
          photoURL: photoURL,
        }
      );
      return res.status(200).send();
    }
  } catch (error) {}
});
router.post("/updateRoomProfile", async (req, res) => {
  try {
    const roomId = req.body.roomId;
    const photoURL = req.body.photoURL;
    await Room.updateOne(
      { _id: roomId },
      {
        photoURL: photoURL,
      }
    );
    return res.status(200).send();
  } catch (error) {}
});
router.get("/getUsers/:id", async (req, res) => {
  try {
    let count: number = Number(req.params.id);
    const currentUserId = req.query.currentUserId;
    const countUser = await User.find({ _id: { $ne: currentUserId } }).count();
    const users = await User.find({ _id: { $ne: currentUserId } })
      .skip(count === 1 ? 0 : count * 20 - 20)
      .limit(20);
    return res.json({
      status: true,
      users: users,
      total_results: Math.ceil(countUser / 20),
    });
  } catch (error) {
    console.log(error);
  }
});
router.get("/getUsersToRoom/:id", async (req, res) => {
  try {
    let count: number = Number(req.params.id);
    const usersInCurrentRoom = req.query.usersInCurrentRoom as string;
    const countUser = await User.find({
      _id: { $nin: JSON.parse(usersInCurrentRoom) },
    }).count();
    const users = await User.find({
      _id: { $nin: JSON.parse(usersInCurrentRoom) },
    })
      .skip(count === 1 ? 0 : count * 20 - 20)
      .limit(20);

    return res.json({
      status: true,
      users: users,
      total_results: Math.ceil(countUser / 20),
    });
  } catch (error) {
    console.log(error);
  }
});
router.get("/getRooms/:id", async (req, res) => {
  try {
    let userId: string = req.params.id;
    const room = await Room.find({ "users.user": userId })
      .populate({
        path: "lastMessage",
        populate: { path: "actedByUser" },
      })
      .populate("users.user")
      .populate("users.nickname");
    return res.json({ room: room });
  } catch (error) {
    console.log(error);
  }
});
router.get("/getMessage/:id", async (req, res) => {
  try {
    const roomId = req.params.id;
    const page = Number(req.query.page);
    const skipWhileNewMessage = Number(req.query.skipWhileNewMessage);
    const countUser = await Message.find({ roomId }).count();
    const messages = await Message.find({ roomId })
      .populate("actedByUser", "displayName photoURL email")
      .populate("reply")
      .skip(
        page === 1
          ? 0 + skipWhileNewMessage
          : page * 10 - 10 + skipWhileNewMessage
      )
      .limit(10)
      .sort({ createdAt: -1 });

    return res.json({
      status: true,
      messages,
      total_results: Math.ceil(countUser / 10),
    });
  } catch (error) {
    console.log(error);
  }
});
router.get("/getUserOfCurrentRoom/:id", async (req, res) => {
  try {
    const roomId = req.params.id;
    const users = await Room.findOne({ _id: roomId }).populate(
      "users.user",
      "displayName photoURL email"
    );
    return res.json(users?.users);
  } catch (error) {
    console.log(error);
  }
});
router.get("/isAcceptLink", async (req, res) => {
  try {
    const userId = req.query.userId;
    const roomId = req.query.roomId;
    const room = await Room.findOne({
      _id: roomId,
    });
    const userExist = room?.users.find((u) => u.user === userId) ? true : false;

    const isAcceptLink = room?.isAcceptLink ? true : false;
    return res.json({ userExist, isAcceptLink });
  } catch (error) {
    console.log(error);
  }
});
router.post("/updateAcceptLink", async (req, res) => {
  try {
    const isSuccess = await Room.updateOne(
      { _id: req.body.roomId },
      { isAcceptLink: req.body.isAccept }
    );
    if (isSuccess) {
      return res.sendStatus(200);
    }
  } catch (error) {
    console.log(error);
  }
});
router.get("/searchUser", async (req, res) => {
  try {
    const searchValue = req.query.searchValue;
    const userSkip = req.query.userSkip as string;
    const search = await User.find({
      displayName: { $regex: searchValue },
      _id: { $nin: JSON.parse(userSkip) },
    });
    return res.json({ search });
  } catch (error) {
    console.log(error);
  }
});
router.get("/getListUserReaction/:id", async (req, res) => {
  try {
    const roomId = req.params.id;
    const messageId = req.query.messageId;
    const mess = await Message.findOne({
      roomId: roomId,
      _id: messageId,
    }).populate("reaction.user");

    if (mess) {
      return res.json({ reaction: mess.reaction });
    }
    return;
  } catch (error) {
    console.log(error);
  }
});
router.get("/getMedia/:id", async (req, res) => {
  try {
    const roomId = req.params.id;
    const mess = await Message.find({
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
  } catch (error) {
    console.log(error);
  }
});
router.get("/delete", async (req, res) => {
  // await User.deleteMany({});
  await Room.deleteMany({});
  await Message.deleteMany({});

  return res.send(true);
});

export default router;

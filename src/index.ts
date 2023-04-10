import express from "express";
import authRouter from "./router";
import http from "http";
import * as dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import SocketConnect from "./socket";
dotenv.config();
const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "https://chatapp-api-r3gm.onrender.com"],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/auth", authRouter);

const server = http.createServer(app);
connectDB();

SocketConnect(server);
server.listen(8000, () => console.log("listening on 8000"));

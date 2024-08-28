import { Request, Response } from "express";
import { testUuid, getChatList, startChat, sendMessage, deleteChat } from "../controller/chat/Chat";
import express from "express";
import {ensureAutorization} from "../middleware/auth";
import { Server as SocketIOServer } from "socket.io";

const router = express.Router();

export default (io: SocketIOServer) => {
  router.post("/startchat", (req, res) => startChat(req, res, io));
  router.post("/sendmessage", (req, res) => sendMessage(req, res, io))
  router.get("/chatlist", getChatList);
  router.post("/delete", (req, res) => deleteChat(req, res, io));
  router.post("/", ensureAutorization, (req, res) => testUuid(req, res))
  return router;
};

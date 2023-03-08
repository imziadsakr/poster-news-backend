import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { customResponse } from "./middlewares/customResponse";
import mongoose from "mongoose";
import { connectDatabase } from "./models";
import routes from "./routes";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import ioConfig from "./lib/ioConfig";
import { ExpressExtends } from "./Types/interfaces";

dotenv.config();

// db initializtaion
mongoose.set("strictQuery", false);
connectDatabase();

import "./crons/runner"; // pull the crons runner, [IMPORTANT]: only pull crons after db initilization

const app: ExpressExtends = express();

app.use(
  cors({
    origin: "*",
  })
);

const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(customResponse);

const publicPath = path.resolve(__dirname + "/../public");

app.use("/api/", routes);

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.use(express.static(publicPath));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

ioConfig(io);

// inserts io to each route/to the app params
app.io = io;

server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

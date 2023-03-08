"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const customResponse_1 = require("./middlewares/customResponse");
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("./models");
const routes_1 = __importDefault(require("./routes"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const ioConfig_1 = __importDefault(require("./lib/ioConfig"));
dotenv_1.default.config();
// db initializtaion
mongoose_1.default.set("strictQuery", false);
(0, models_1.connectDatabase)();
require("./crons/runner"); // pull the crons runner, [IMPORTANT]: only pull crons after db initilization
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "*",
}));
const port = process.env.PORT;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(customResponse_1.customResponse);
const publicPath = path_1.default.resolve(__dirname + "/../public");
app.use("/api/", routes_1.default);
app.get("/", (req, res) => {
    res.send("Express + TypeScript Server");
});
app.use(express_1.default.static(publicPath));
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
(0, ioConfig_1.default)(io);
// inserts io to each route/to the app params
app.io = io;
server.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

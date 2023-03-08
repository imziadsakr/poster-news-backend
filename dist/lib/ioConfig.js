"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (io) => {
    io.on('connection', (socket) => {
        console.log('a user connected');
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });
};

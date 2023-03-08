"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = require("mongoose");
const CommentSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Users'
    },
    post: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Posts'
    },
    text: String,
    createdAt: Date,
    replyTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Comments'
    },
    replies: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Comments'
        }
    ]
});
const Comment = (0, mongoose_1.model)('Comment', CommentSchema);
exports.Comment = Comment;

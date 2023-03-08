"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
const mongoose_1 = require("mongoose");
const PostSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Users'
    },
    title: String,
    text: String,
    images: [String],
    createdAt: Date,
    upvotes: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Users'
        }
    ],
    downvotes: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Users'
        }
    ],
    totalVotes: {
        type: Number,
        default: 0
    }
});
const Post = (0, mongoose_1.model)('Posts', PostSchema);
exports.Post = Post;

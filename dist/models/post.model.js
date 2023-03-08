"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
const mongoose_1 = require("mongoose");
const PostSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: String,
    text: String,
    images: [String],
    totalReplies: Number,
    repliedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post'
    },
    replies: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Post'
        }
    ],
    upvotes: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    downvotes: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    totalVotes: {
        type: Number,
        default: 0
    },
    preview: {
        url: String,
        favicons: [String],
        siteName: String,
        images: [String],
        title: String,
        description: String,
        youtubeId: String
    },
    createdAt: Date,
    updatedAt: Date,
    // these fields are used by/for post ranking
    reputation: { type: mongoose_1.Schema.Types.Number, default: 0 },
    lastUpvotesWeight: { type: mongoose_1.Schema.Types.Number, default: 0 },
    lastDownvotesWeight: { type: mongoose_1.Schema.Types.Number, default: 0 }
});
function autoPopulateReplies(next) {
    const options = this.getOptions();
    this.populate([
        {
            path: 'replies',
            options
        },
        {
            path: 'userId',
            select: '_id username displayName reputation avatar',
            options
        }
    ]);
    next();
}
PostSchema.pre('find', function (next) {
    if (this.getOptions().autoPopulateReplies) {
        autoPopulateReplies.call(this, next);
    }
    else {
        next();
    }
});
const Post = (0, mongoose_1.model)('Post', PostSchema);
exports.Post = Post;

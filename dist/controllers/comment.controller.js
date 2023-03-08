"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.getCommentsFromPost = exports.addComment = exports.addCommentReply = void 0;
const models_1 = require("../models/");
const statusCodes_1 = require("../constants/statusCodes");
const addCommentReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId, commentId } = req.params;
    const { userId, text } = req.body;
    const findUser = yield models_1.User.findById(userId);
    if (!findUser)
        return res.sendResponse(null, { message: 'User not found!' }, statusCodes_1.statusCodes.NOT_FOUND);
    const newComment = new models_1.Comment({
        user: userId,
        post: postId,
        text,
        replyTo: commentId,
        createdAt: new Date()
    });
    yield newComment.save();
    yield models_1.Comment.findByIdAndUpdate(commentId, {
        $push: {
            replies: newComment._id
        }
    });
    findUser.balance = Number((findUser.balance - 0.01).toFixed(2));
    yield findUser.save();
    res.sendResponse({
        message: 'Successfully added reply!'
    }, null, statusCodes_1.statusCodes.OK);
});
exports.addCommentReply = addCommentReply;
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    const { userId, text } = req.body;
    const findUser = yield models_1.User.findById(userId);
    if (!findUser)
        return res.sendResponse(null, { message: 'User not found!' }, statusCodes_1.statusCodes.NOT_FOUND);
    const newComment = new models_1.Comment({
        user: userId,
        post: postId,
        text,
        createdAt: new Date()
    });
    yield newComment.save();
    findUser.balance = Number((findUser.balance - 0.01).toFixed(2));
    yield findUser.save();
    res.sendResponse({
        message: 'Successfully added comment'
    }, null, statusCodes_1.statusCodes.OK);
});
exports.addComment = addComment;
const getCommentsFromPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId } = req.params;
    const comments = yield models_1.Comment.find({
        post: postId,
        replyTo: { $exists: false }
    })
        .populate('user post replies')
        .populate({
        path: 'replies',
        model: 'Comments',
        populate: [
            {
                path: 'user',
                model: 'Users'
            },
            {
                path: 'post',
                model: 'Posts'
            }
        ]
    })
        .sort('-createdAt')
        .lean();
    res.sendResponse(comments, null, statusCodes_1.statusCodes.OK);
});
exports.getCommentsFromPost = getCommentsFromPost;
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const findComment = yield models_1.Comment.findById(commentId);
    if (!findComment)
        return res.sendResponse(null, {
            message: 'Comment not found!'
        }, statusCodes_1.statusCodes.NOT_FOUND);
    yield models_1.Comment.findByIdAndDelete(commentId)
        .then(() => __awaiter(void 0, void 0, void 0, function* () {
        //remove id from parent if reply
        if (findComment.replyTo) {
            yield models_1.Comment.findByIdAndUpdate(findComment.replyTo, {
                $pull: {
                    replies: commentId
                }
            });
        }
        //remove all replies if parent
        else if (findComment.replies &&
            findComment.replies.length > 0) {
            yield models_1.Comment.deleteMany({
                _id: { $in: findComment.replies }
            });
        }
        res.sendResponse({
            message: 'Successfully deleted!'
        }, null, statusCodes_1.statusCodes.OK);
    }))
        .catch(e => res.sendResponse(null, e.message, statusCodes_1.statusCodes.BAD_REQUEST));
});
exports.deleteComment = deleteComment;

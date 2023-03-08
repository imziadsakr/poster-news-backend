"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const comment_controller_1 = require("../controllers/comment.controller");
const router = express_1.default.Router();
router.route('/addComment/:postId').post(comment_controller_1.addComment);
router
    .route('/addCommentReply/:postId/:commentId')
    .post(comment_controller_1.addCommentReply);
router.route('/getCommentsFromPost/:postId').get(comment_controller_1.getCommentsFromPost);
router.route('/deleteComment/:commentId').delete(comment_controller_1.deleteComment);
exports.default = router;

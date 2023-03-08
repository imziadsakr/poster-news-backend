"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const post_controller_1 = require("../controllers/post.controller");
const multer_1 = __importDefault(require("multer"));
const uploadPromisify_1 = __importDefault(require("../middlewares/uploadPromisify"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `./public/images`);
    },
    filename: (req, file, cb) => {
        const regexMatch = file.originalname.match(/\..*$/);
        cb(null, file.fieldname +
            '-' +
            Date.now() +
            (regexMatch && regexMatch.length > 0 ? regexMatch[0] : '.jpg'));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fieldSize: 25 * 1024 * 1024 }
});
const router = express_1.default.Router();
// router.route('/createPost').post(upload.any(), createPost)
router.route('/uploadFile').post(uploadPromisify_1.default, post_controller_1.uploadToBucket);
router.route('/removeFile').post(post_controller_1.removeFromBucket);
router.route('/createPost').post(upload.any(), post_controller_1.createPost);
router
    .route('/createPostReply/:postId')
    .post(upload.any(), post_controller_1.createPostReply);
router.route('/editPost/:id').post(upload.any(), post_controller_1.editPost);
router.route('/deletePost/:id').delete(post_controller_1.deletePost);
router.route('/getExplorePosts').get(post_controller_1.getExplorePosts);
router.route('/getTrendingPosts').get(post_controller_1.getTrendingPosts);
router.route('/upvotePost/:id').post(post_controller_1.upvotePost);
router.route('/downvotePost/:id').post(post_controller_1.downvotePost);
router.route('/getSinglePost/:id').get(post_controller_1.getSinglePost);
router.route('/getLinkDetails/:url').get(post_controller_1.getLinkDetails);
router.route('/getPostReplies/:id').get(post_controller_1.getPostReplies);
exports.default = router;

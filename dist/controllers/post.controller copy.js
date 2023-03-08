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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSinglePost = exports.downvotePost = exports.upvotePost = exports.getLinkDetails = exports.getTrendingPosts = exports.getExplorePosts = exports.createPost = void 0;
const models_1 = require("../models/");
const statusCodes_1 = require("../constants/statusCodes");
const link_preview_js_1 = require("link-preview-js");
const node_dns_1 = __importDefault(require("node:dns"));
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, text, title } = req.body;
    const data = {
        userId,
        title,
        createdAt: new Date()
    };
    if (text) {
        data['text'] = text;
    }
    if (req.files && req.files.length > 0 && Array.isArray(req.files)) {
        let tempFilePath = [];
        for (let i = 0; i < req.files.length; i++) {
            tempFilePath.push(req.protocol +
                '://' +
                req.headers.host +
                '/images/' +
                req.files[i].filename);
        }
        data['images'] = tempFilePath;
    }
    const post = new models_1.Post(data);
    try {
        yield post.save();
        res.sendResponse(null, null, statusCodes_1.statusCodes.OK);
    }
    catch (error) {
        res.sendResponse(null, { message: error.message }, statusCodes_1.statusCodes.BAD_REQUEST);
    }
});
exports.createPost = createPost;
const getExplorePosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const posts = yield models_1.Post.aggregate([
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $lookup: {
                from: 'users',
                let: { userId: '$userId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$_id', '$$userId']
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            displayName: 1,
                            reputation: 1
                        }
                    }
                ],
                as: 'userId'
            }
        },
        {
            $unwind: {
                path: '$userId'
            }
        }
    ]);
    res.sendResponse(posts, null, statusCodes_1.statusCodes.OK);
});
exports.getExplorePosts = getExplorePosts;
const getTrendingPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const posts = yield models_1.Post.aggregate([
        {
            $sort: {
                totalVotes: -1
            }
        },
        {
            $lookup: {
                from: 'users',
                let: { userId: '$userId' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$_id', '$$userId']
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            displayName: 1,
                            reputation: 1
                        }
                    }
                ],
                as: 'userId'
            }
        },
        {
            $unwind: {
                path: '$userId'
            }
        }
    ]);
    res.sendResponse(posts, null, statusCodes_1.statusCodes.OK);
});
exports.getTrendingPosts = getTrendingPosts;
const getLinkDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url } = req.params;
    if (!url)
        return res.sendResponse(null, { message: 'Url required!' }, statusCodes_1.statusCodes.BAD_REQUEST);
    (0, link_preview_js_1.getLinkPreview)(url, {
        followRedirects: `manual`,
        handleRedirects: (baseURL, forwardedURL) => {
            const urlObj = new URL(baseURL);
            const forwardedURLObj = new URL(forwardedURL);
            if (forwardedURLObj.hostname === urlObj.hostname ||
                forwardedURLObj.hostname === 'www.' + urlObj.hostname ||
                'www.' + forwardedURLObj.hostname === urlObj.hostname) {
                return true;
            }
            else {
                return false;
            }
        },
        resolveDNSHost: (url) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const hostname = new URL(url).hostname;
                node_dns_1.default.lookup(hostname, (err, address, family) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(address); // if address resolves to localhost or '127.0.0.1' library will throw an error
                });
            });
        })
    })
        .then(data => res.sendResponse(data, null, statusCodes_1.statusCodes.OK))
        .catch(e => {
        res.sendResponse(null, { message: e.message }, statusCodes_1.statusCodes.BAD_REQUEST);
        // will throw a detected redirection to localhost
    });
});
exports.getLinkDetails = getLinkDetails;
const upvotePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId } = req.body;
    const findPost = yield models_1.Post.findOne({
        _id: id
    });
    if (!findPost)
        return res.sendResponse(null, { message: 'Post not found!' }, statusCodes_1.statusCodes.NOT_FOUND);
    const findUser = yield models_1.User.findById(userId);
    if (!findUser)
        return res.sendResponse(null, { message: 'User not found!' }, statusCodes_1.statusCodes.NOT_FOUND);
    const tempUpvotes = findPost && findPost.upvotes
        ? findPost.upvotes.map(item => item + '')
        : [];
    const tempDownvotes = findPost && findPost.downvotes
        ? findPost.downvotes.map(item => item + '')
        : [];
    let hasDownvote = false;
    let downvotes = [...tempDownvotes];
    if (downvotes && downvotes.includes(userId)) {
        hasDownvote = true;
        downvotes.splice(downvotes.findIndex(value => value + '' === userId + ''), 1);
    }
    let upvotes = [...tempUpvotes];
    upvotes.push(userId);
    const updateQuery = {
        upvotes: [...upvotes],
        downvotes: [...downvotes],
        totalVotes: findPost.totalVotes
            ? hasDownvote
                ? findPost.totalVotes + 2
                : findPost.totalVotes + 1
            : 1
    };
    const updatedPost = yield models_1.Post.findByIdAndUpdate(id, updateQuery, {
        new: true
    });
    findUser.balance = Number((findUser.balance - 0.01).toFixed(2));
    findUser.save();
    res.sendResponse(updatedPost, null, statusCodes_1.statusCodes.OK);
});
exports.upvotePost = upvotePost;
const downvotePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId } = req.body;
    const findPost = yield models_1.Post.findOne({
        _id: id
    }).lean();
    if (!findPost)
        return res.sendResponse(null, { message: 'Post not found!' }, statusCodes_1.statusCodes.NOT_FOUND);
    const findUser = yield models_1.User.findById(userId);
    if (!findUser)
        return res.sendResponse(null, { message: 'User not found!' }, statusCodes_1.statusCodes.NOT_FOUND);
    const tempUpvotes = findPost && findPost.upvotes
        ? findPost.upvotes.map(item => item + '')
        : [];
    const tempDownvotes = findPost && findPost.downvotes
        ? findPost.downvotes.map(item => item + '')
        : [];
    let hasUpvote = false;
    const upvotes = [...tempUpvotes];
    if (upvotes && upvotes.includes(userId)) {
        hasUpvote = true;
        upvotes.splice(upvotes.findIndex(value => value + '' === userId + ''), 1);
    }
    let downvotes = [...tempDownvotes];
    downvotes.push(userId);
    const updateQuery = {
        upvotes: [...upvotes],
        downvotes: [...downvotes],
        totalVotes: findPost.totalVotes
            ? hasUpvote
                ? findPost.totalVotes - 2
                : findPost.totalVotes - 1
            : -1
    };
    const updatedPost = yield models_1.Post.findByIdAndUpdate(id, updateQuery, {
        new: true
    });
    findUser.balance = Number((findUser.balance - 0.01).toFixed(2));
    findUser.save();
    res.sendResponse(updatedPost, null, statusCodes_1.statusCodes.OK);
});
exports.downvotePost = downvotePost;
const getSinglePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const findPost = yield models_1.Post.findOne({
        _id: id
    })
        .populate('userId')
        .lean();
    if (!findPost)
        return res.sendResponse(null, { message: 'Post not found!' }, statusCodes_1.statusCodes.NOT_FOUND);
    res.sendResponse(findPost, null, statusCodes_1.statusCodes.OK);
});
exports.getSinglePost = getSinglePost;

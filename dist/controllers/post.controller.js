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
exports.getPostReplies = exports.getSinglePost = exports.downvotePost = exports.upvotePost = exports.getLinkDetails = exports.getTrendingPosts = exports.getExplorePosts = exports.deletePost = exports.editPost = exports.createPostReply = exports.createPost = exports.removeFromBucket = exports.uploadToBucket = void 0;
const fs_1 = require("fs");
const link_preview_js_1 = require("link-preview-js");
const mongoose_1 = __importDefault(require("mongoose"));
const node_dns_1 = __importDefault(require("node:dns"));
const statusCodes_1 = require("../constants/statusCodes");
const models_1 = require("../models/");
const storage_1 = require("@google-cloud/storage");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const storage = new storage_1.Storage({
    projectId: process.env.GCOULD_PROJECT_ID,
    keyFilename: `authKey/service_account_key.json`,
});
const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET || "");
const uploadToBucket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        return res.status(200).json({
            url: ((_a = req === null || req === void 0 ? void 0 : req.file) === null || _a === void 0 ? void 0 : _a.filename) || ""
        });
    }
    catch (err) {
        console.log(err);
    }
});
exports.uploadToBucket = uploadToBucket;
const removeFromBucket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filename } = req.body;
        const file = bucket.file(`${filename}`);
        yield file.delete();
        return res.status(200).json({
            message: 'success'
        });
    }
    catch (err) {
        console.log(err);
    }
});
exports.removeFromBucket = removeFromBucket;
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, text, title, preview, images } = req.body;
    const { io } = req.app;
    const data = {
        userId,
        title,
        createdAt: new Date()
    };
    if (preview && preview === 'true') {
        data['preview'] = {
            favicons: req.body.preview_favicons
                ? req.body.preview_favicons.split(',')
                : undefined,
            description: req.body.preview_description,
            images: req.body.preview_images
                ? req.body.preview_images.split(',')
                : undefined,
            siteName: req.body.preview_siteName,
            title: req.body.preview_title,
            url: req.body.preview_url,
            youtubeId: req.body.preview_youtubeId
        };
    }
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
    if (images && images.length > 0 && Array.isArray(images)) {
        let tempFilePath = [];
        for (let i = 0; i < images.length; i++) {
            tempFilePath.push(`https://storage.googleapis.com/${process.env.GCLOUD_STORAGE_BUCKET}/${images[i]}`);
        }
        data['images'] = tempFilePath;
    }
    const post = new models_1.Post(data);
    try {
        const userData = yield models_1.User.findById(userId).select('username displayName balance reputation avatar createdAt');
        post.reputation = (userData === null || userData === void 0 ? void 0 : userData.reputation) || 0; // initial post reputation
        yield post.save();
        io === null || io === void 0 ? void 0 : io.emit('NEW_POST', {
            user: userData,
            postId: post._id,
            title: post.title
        });
        res.sendResponse(post, null, statusCodes_1.statusCodes.OK);
    }
    catch (error) {
        res.sendResponse(null, { message: error.message }, statusCodes_1.statusCodes.BAD_REQUEST);
    }
});
exports.createPost = createPost;
const createPostReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, text, preview } = req.body;
    const { postId } = req.params;
    const { io } = req.app;
    if (!postId)
        return res.sendResponse(null, { message: 'Wrong post id!' }, statusCodes_1.statusCodes.BAD_REQUEST);
    const data = {
        userId,
        repliedTo: postId,
        createdAt: new Date(),
        reputation: 0,
        lastUpvotesWeight: 0,
        lastDownvotesWeight: 0
    };
    if (preview && preview === 'true') {
        data['preview'] = {
            favicons: req.body.preview_favicons
                ? req.body.preview_favicons.split(',')
                : undefined,
            description: req.body.preview_description,
            images: req.body.preview_images
                ? req.body.preview_images.split(',')
                : undefined,
            siteName: req.body.preview_siteName,
            title: req.body.preview_title,
            url: req.body.preview_url,
            youtubeId: req.body.preview_youtubeId
        };
    }
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
        yield models_1.Post.findByIdAndUpdate(postId, {
            $addToSet: { replies: post._id }
        });
        const userData = yield models_1.User.findById(userId).select('username displayName balance reputation avatar createdAt');
        io === null || io === void 0 ? void 0 : io.emit('NEW_POST', {
            user: userData,
            postId: post._id,
            title: post.title
        });
        res.sendResponse(null, null, statusCodes_1.statusCodes.OK);
    }
    catch (error) {
        res.sendResponse(null, { message: error.message }, statusCodes_1.statusCodes.BAD_REQUEST);
    }
});
exports.createPostReply = createPostReply;
const editPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { text, title, preview, prevImages } = req.body;
    const foundPost = yield models_1.Post.findById(id);
    if (!foundPost)
        return res.sendResponse(null, {
            message: 'Post not found!'
        }, statusCodes_1.statusCodes.NOT_FOUND);
    foundPost.title = title;
    foundPost.updatedAt = new Date();
    if (preview && preview === 'true') {
        foundPost.preview = {
            favicons: req.body.preview_favicons
                ? req.body.preview_favicons.split(',')
                : undefined,
            description: req.body.preview_description,
            images: req.body.preview_images
                ? req.body.preview_images.split(',')
                : undefined,
            siteName: req.body.preview_siteName,
            title: req.body.preview_title,
            url: req.body.preview_url,
            youtubeId: req.body.preview_youtubeId
        };
    }
    else if (foundPost.preview && foundPost.preview.url && !preview) {
        foundPost.preview = undefined;
    }
    if (text) {
        foundPost.text = text;
    }
    let newImages = [];
    if (req.files && req.files.length > 0 && Array.isArray(req.files)) {
        let tempFilePath = [];
        for (let i = 0; i < req.files.length; i++) {
            tempFilePath.push(req.protocol +
                '://' +
                req.headers.host +
                '/images/' +
                req.files[i].filename);
        }
        newImages = tempFilePath;
    }
    const tempPrevImages = prevImages ? prevImages.split(',') : [];
    if (foundPost.images) {
        const imagesToDelete = foundPost.images.filter((image) => !tempPrevImages.includes(image));
        imagesToDelete.forEach((imageToDelete) => {
            const filename = imageToDelete.split('/').pop(); // get the filename from the URL
            const path = `./public/images/${filename}`; // build the path to the file
            (0, fs_1.unlink)(path, (error) => {
                if (error) {
                }
                else {
                }
            });
        });
    }
    foundPost.images = [...tempPrevImages, ...newImages];
    // const post = new Post(data)
    try {
        yield foundPost.save();
        res.sendResponse(null, null, statusCodes_1.statusCodes.OK);
    }
    catch (error) {
        res.sendResponse(null, { message: error.message }, statusCodes_1.statusCodes.BAD_REQUEST);
    }
});
exports.editPost = editPost;
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const foundPost = yield models_1.Post.findById(id);
    if (foundPost) {
        const nestedReplies = yield models_1.Post.aggregate([
            {
                $match: {
                    _id: foundPost._id
                }
            },
            {
                $graphLookup: {
                    from: 'posts',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'repliedTo',
                    as: 'replies',
                    depthField: 'depth'
                }
            }
        ]);
        const replies = nestedReplies && nestedReplies[0] && nestedReplies[0].replies
            ? nestedReplies[0].replies
            : [];
        models_1.Post.findByIdAndDelete(id)
            .then((data) => __awaiter(void 0, void 0, void 0, function* () {
            if (!data)
                throw Error('Post not found!');
            const repliedTo = data.repliedTo;
            if (repliedTo) {
                yield models_1.Post.findByIdAndUpdate(repliedTo, {
                    $pull: { replies: data._id }
                });
            }
            //delete all parent and nested images
            let imagesToDelete = data.images ? data.images : [];
            for (let reply of replies) {
                if (reply.images && reply.images.length > 0) {
                    imagesToDelete = [...imagesToDelete, ...reply.images];
                }
            }
            imagesToDelete &&
                imagesToDelete.forEach((imageToDelete) => {
                    const filename = imageToDelete.split('/').pop();
                    const path = `./public/images/${filename}`;
                    (0, fs_1.unlink)(path, (error) => {
                        if (error) {
                            console.error(`Failed to delete ${path}: ${error.message}`);
                        }
                        else {
                            console.log(`Deleted ${path}`);
                        }
                    });
                });
            //deleting all replies
            for (let reply of replies) {
                yield models_1.Post.findByIdAndDelete(reply._id);
            }
            res.sendResponse(null, null, statusCodes_1.statusCodes.NO_CONTENT);
        }))
            .catch(e => res.sendResponse(null, {
            message: e.message
        }, statusCodes_1.statusCodes.NOT_FOUND));
    }
    else {
        res.sendResponse(null, {
            message: 'Post not found!'
        }, statusCodes_1.statusCodes.NOT_FOUND);
    }
});
exports.deletePost = deletePost;
const getExplorePosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { per_page, page } = req.query;
    let pipeline = [
        {
            $sort: {
                createdAt: -1
            }
        }
    ];
    if (per_page && page) {
        pipeline.push({
            $skip: (Number(page) - 1) * Number(per_page)
        });
        pipeline.push({
            $limit: Number(per_page)
        });
    }
    pipeline = [
        ...pipeline,
        ...[
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
                                reputation: 1,
                                avatar: 1
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
            },
            {
                $lookup: {
                    from: 'posts',
                    let: { repliedTo: '$repliedTo' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', { $toObjectId: '$$repliedTo' }]
                                }
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
                                                $eq: ['$_id', { $toObjectId: '$$userId' }]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            username: 1,
                                            displayName: 1,
                                            reputation: 1,
                                            balance: 1,
                                            avatar: 1
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
                        },
                        {
                            $project: {
                                _id: 1,
                                text: 1,
                                title: 1,
                                images: 1,
                                repliedTo: 1,
                                replies: 1,
                                userId: 1,
                                createdAt: 1,
                                upvotes: 1,
                                downvotes: 1,
                                totalVotes: 1,
                                preview: 1
                            }
                        }
                    ],
                    as: 'repliedTo'
                }
            },
            {
                $unwind: {
                    path: '$repliedTo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    title: 1,
                    text: 1,
                    images: 1,
                    createdAt: 1,
                    upvotes: 1,
                    downvotes: 1,
                    totalVotes: 1,
                    preview: 1,
                    replies: 1,
                    repliedTo: 1
                }
            }
        ]
    ];
    const posts = yield models_1.Post.aggregate(pipeline);
    res.sendResponse(posts, null, statusCodes_1.statusCodes.OK);
});
exports.getExplorePosts = getExplorePosts;
const getTrendingPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { per_page, page } = req.query;
    let pipeline = [
        {
            $sort: {
                reputation: -1
            }
        }
    ];
    if (per_page && page) {
        pipeline.push({
            $skip: (Number(page) - 1) * Number(per_page)
        });
        pipeline.push({
            $limit: Number(per_page)
        });
    }
    pipeline = [
        ...pipeline,
        ...[
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
                                reputation: 1,
                                avatar: 1
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
            },
            {
                $lookup: {
                    from: 'posts',
                    let: { repliedTo: '$repliedTo' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', { $toObjectId: '$$repliedTo' }]
                                }
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
                                                $eq: ['$_id', { $toObjectId: '$$userId' }]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            username: 1,
                                            displayName: 1,
                                            reputation: 1,
                                            balance: 1,
                                            avatar: 1
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
                        },
                        {
                            $project: {
                                _id: 1,
                                text: 1,
                                title: 1,
                                images: 1,
                                repliedTo: 1,
                                replies: 1,
                                userId: 1,
                                createdAt: 1,
                                upvotes: 1,
                                downvotes: 1,
                                totalVotes: 1,
                                preview: 1
                            }
                        }
                    ],
                    as: 'repliedTo'
                }
            },
            {
                $unwind: {
                    path: '$repliedTo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    title: 1,
                    text: 1,
                    images: 1,
                    createdAt: 1,
                    upvotes: 1,
                    downvotes: 1,
                    totalVotes: 1,
                    preview: 1,
                    replies: 1,
                    repliedTo: 1
                }
            }
        ]
    ];
    const posts = yield models_1.Post.aggregate(pipeline);
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
            : 1,
        lastUpvotesWeight: (findPost.lastUpvotesWeight || 0) + findUser.reputation,
        lastDownvotesWeight: hasDownvote
            ? (findPost.lastDownvotesWeight || 0) - findUser.reputation
            : findPost.lastDownvotesWeight || 0
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
            : -1,
        lastUpvotesWeight: hasUpvote
            ? (findPost.lastUpvotesWeight || 0) - findUser.reputation
            : findPost.lastUpvotesWeight || 0,
        lastDownvotesWeight: (findPost.lastDownvotesWeight || 0) + findUser.reputation
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
    let objId;
    try {
        objId = new mongoose_1.default.Types.ObjectId(id);
    }
    catch (e) {
        return res.sendResponse(null, { message: 'Wrong post id!' }, statusCodes_1.statusCodes.BAD_REQUEST);
    }
    const foundPost = yield models_1.Post.findById(objId);
    if (foundPost) {
        let pipeline = [
            {
                $match: {
                    _id: objId
                }
            },
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
                                reputation: 1,
                                avatar: 1
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
        ];
        if (foundPost.repliedTo) {
            pipeline.push({
                $lookup: {
                    from: 'posts',
                    let: { repliedTo: '$repliedTo' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', { $toObjectId: '$$repliedTo' }]
                                }
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
                                                $eq: ['$_id', { $toObjectId: '$$userId' }]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            username: 1,
                                            displayName: 1,
                                            reputation: 1,
                                            balance: 1,
                                            avatar: 1
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
                        },
                        {
                            $project: {
                                _id: 1,
                                text: 1,
                                title: 1,
                                images: 1,
                                repliedTo: 1,
                                replies: 1,
                                userId: 1,
                                createdAt: 1,
                                upvotes: 1,
                                downvotes: 1,
                                totalVotes: 1,
                                preview: 1
                            }
                        }
                    ],
                    as: 'repliedTo'
                }
            });
            pipeline.push({
                $unwind: {
                    path: '$repliedTo'
                }
            });
        }
        pipeline.push({
            $project: {
                _id: 1,
                userId: 1,
                title: 1,
                text: 1,
                images: 1,
                createdAt: 1,
                upvotes: 1,
                downvotes: 1,
                totalVotes: 1,
                replies: 1,
                repliedTo: 1,
                preview: 1
            }
        });
        const singlePost = yield models_1.Post.aggregate(pipeline);
        if (!singlePost || (singlePost && singlePost.length <= 0))
            return res.sendResponse(null, { message: 'Post not found!' }, statusCodes_1.statusCodes.NOT_FOUND);
        res.sendResponse(singlePost[0], null, statusCodes_1.statusCodes.OK);
    }
    else {
        return res.sendResponse(null, { message: 'Post not found!' }, statusCodes_1.statusCodes.NOT_FOUND);
    }
});
exports.getSinglePost = getSinglePost;
const getPostReplies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    let objId;
    try {
        objId = new mongoose_1.default.Types.ObjectId(id);
    }
    catch (e) {
        return res.sendResponse(null, { message: 'Wrong post id!' }, statusCodes_1.statusCodes.BAD_REQUEST);
    }
    const singlePost = yield models_1.Post.find({
        _id: objId
    })
        .populate('repliedTo')
        .setOptions({
        autoPopulateReplies: true
    });
    if (!singlePost || (singlePost && singlePost.length <= 0))
        return res.sendResponse(null, { message: 'Post not found!' }, statusCodes_1.statusCodes.NOT_FOUND);
    res.sendResponse(singlePost[0], null, statusCodes_1.statusCodes.OK);
});
exports.getPostReplies = getPostReplies;

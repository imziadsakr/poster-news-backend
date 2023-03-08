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
exports.LoginUser = exports.RegisterUser = void 0;
const models_1 = require("../models/");
const statusCodes_1 = require("../constants/statusCodes");
const unique_username_generator_1 = require("unique-username-generator");
const generateAvatar_1 = require("../lib/generateAvatar");
const RegisterUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const findUser = yield models_1.User.find({ username });
    if (findUser && findUser.length > 0) {
        return res.sendResponse(null, { message: 'Username already exists!' }, statusCodes_1.statusCodes.BAD_REQUEST);
    }
    try {
        const usersArray = [];
        const parentAvatar = yield (0, generateAvatar_1.generateAvatar)(username, true);
        const parentUser = new models_1.User({
            username,
            password: password,
            displayName: username,
            reputation: 5,
            balance: 100.0,
            avatar: req.protocol +
                '://' +
                req.headers.host +
                '/' +
                parentAvatar.imagePath,
            createdAt: new Date()
        });
        yield parentUser.save();
        usersArray.push(parentUser);
        for (let i = 0; i < 3; i++) {
            const randomUsername = (0, unique_username_generator_1.generateUsername)('-', undefined, 12);
            const randomAvatar = yield (0, generateAvatar_1.generateAvatar)(randomUsername, true);
            const user = new models_1.User({
                username: username + '-' + randomUsername,
                password: password,
                displayName: randomUsername,
                avatar: req.protocol +
                    '://' +
                    req.headers.host +
                    '/' +
                    randomAvatar.imagePath,
                reputation: 1,
                parent: parentUser._id,
                balance: 100.0,
                createdAt: new Date()
            });
            yield user.save();
            usersArray.push(user);
        }
        res.sendResponse(usersArray, null, statusCodes_1.statusCodes.OK);
    }
    catch (error) {
        res.sendResponse(null, { message: error.message }, statusCodes_1.statusCodes.BAD_REQUEST);
    }
});
exports.RegisterUser = RegisterUser;
const LoginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const user = yield models_1.User.findOne({ username });
        if (!user) {
            return res.sendResponse(null, { message: 'Invalid username or password / Not Found User' }, statusCodes_1.statusCodes.UNAUTHORIZED);
        }
        user.comparePassword(password, function (err, isMatch) {
            return __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    return res.sendResponse(null, {
                        message: 'Invalid username or password / Not Found User'
                    }, statusCodes_1.statusCodes.INTERNAL_SERVER_ERROR);
                }
                if (isMatch) {
                    const userId = user.parent ? user.parent : user._id;
                    const userList = yield models_1.User.find({
                        $or: [
                            {
                                _id: userId
                            },
                            {
                                parent: userId
                            }
                        ]
                    });
                    res.sendResponse(userList, null, statusCodes_1.statusCodes.OK);
                }
                else {
                    return res.sendResponse(null, {
                        message: 'Invalid username or password / Not Found User'
                    }, statusCodes_1.statusCodes.UNAUTHORIZED);
                }
            });
        });
    }
    catch (error) {
        return res.sendResponse(null, { message: error.message }, statusCodes_1.statusCodes.INTERNAL_SERVER_ERROR);
    }
});
exports.LoginUser = LoginUser;

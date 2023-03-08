"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserSchema = new mongoose_1.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String },
    displayName: { type: String },
    avatar: { type: String },
    reputation: { type: Number },
    balance: { type: Number },
    parent: { type: mongoose_1.Types.ObjectId, ref: 'User' },
    createdAt: Date
});
UserSchema.pre('save', function (next) {
    const user = this;
    const saltRounds = 8;
    //ignore for isNew property of mongoose
    // @ts-ignore
    if (!user.password || !this.isNew)
        return next();
    bcrypt_1.default.hash(user.password, saltRounds, function (err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});
// @ts-ignore
UserSchema.methods.comparePassword = function (plaintextPassword, callback) {
    bcrypt_1.default.compare(plaintextPassword, this.password, function (err, isMatch) {
        if (err) {
            return callback(err, isMatch);
        }
        callback(null, isMatch);
    });
};
const User = (0, mongoose_1.model)('User', UserSchema);
exports.User = User;

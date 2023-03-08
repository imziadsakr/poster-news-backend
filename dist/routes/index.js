"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_route_1 = __importDefault(require("./auth.route"));
const post_route_1 = __importDefault(require("./post.route"));
const comment_route_1 = __importDefault(require("./comment.route"));
exports.default = [].concat(auth_route_1.default, post_route_1.default, comment_route_1.default);

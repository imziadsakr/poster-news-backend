"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const multer_google_storage_1 = __importDefault(require("multer-google-storage"));
const uuid_1 = require("uuid");
const util = __importStar(require("util"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uploadConfig = (0, multer_1.default)({
    storage: new multer_google_storage_1.default({
        projectId: process.env.GCOULD_PROJECT_ID,
        keyFilename: `authKey/service_account_key.json`,
        bucket: process.env.GCLOUD_STORAGE_BUCKET,
        filename: (req, file, cb) => {
            cb(null, `medias/${(0, uuid_1.v4)()}_${file.mimetype.split("/")[0]}_${file.originalname}`);
        }
    }),
    limits: {
        fileSize: 15 * 1024 * 1024
    }
}).single('image');
const uploadGCP = util.promisify(uploadConfig);
exports.default = uploadGCP;

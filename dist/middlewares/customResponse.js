"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customResponse = void 0;
const customResponse = (req, res, next) => {
    res.sendResponse = (data, error, status = 200) => {
        if (error) {
            res.status(status).json({
                success: false,
                error: error
            });
        }
        else {
            res.status(status).json({
                success: true,
                data: data
            });
        }
    };
    next();
};
exports.customResponse = customResponse;

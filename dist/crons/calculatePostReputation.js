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
const cron = require("node-cron");
const models_1 = require("../models");
// run every 30 mins
cron.schedule("*/10 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("[CRON]: Calculating post reputation");
    yield models_1.Post.updateMany({}, [
        {
            $set: {
                // calculate reputation
                // [Formula] new reputation =
                //        (0.1 * old reputation) +
                //        (0.9 *
                //            (total weighted upvotes after last cron run - total weighted downvotes after last cron run)
                //        )
                reputation: {
                    $add: [
                        { $multiply: [0.1, "$reputation"] },
                        {
                            $multiply: [
                                0.9,
                                { $subtract: ["$lastUpvotesWeight", "$lastDownvotesWeight"] },
                            ],
                        },
                    ],
                },
                // set the votes weight back to 0
                lastUpvotesWeight: 0,
                lastDownvotesWeight: 0,
            },
        },
    ]);
}));

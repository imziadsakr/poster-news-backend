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
exports.generateAvatar = void 0;
const randpix_1 = require("randpix");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const types = [
    randpix_1.RandpixColorScheme.NEUTRAL,
    randpix_1.RandpixColorScheme.MAGENTA,
    randpix_1.RandpixColorScheme.MAGENTA_SEPIA,
    randpix_1.RandpixColorScheme.LIGHT_GREEN,
    randpix_1.RandpixColorScheme.SEPIA,
    randpix_1.RandpixColorScheme.MAGMA,
    randpix_1.RandpixColorScheme.ICE,
    randpix_1.RandpixColorScheme.DARK_SEPIA,
    randpix_1.RandpixColorScheme.SOLARIZE,
    randpix_1.RandpixColorScheme.DARKULA,
    randpix_1.RandpixColorScheme.BLUE,
    randpix_1.RandpixColorScheme.RETROWAVE,
    randpix_1.RandpixColorScheme.BLOOD,
    randpix_1.RandpixColorScheme.PURPUR,
    randpix_1.RandpixColorScheme.GRAYSCALE_MAGENTA,
    randpix_1.RandpixColorScheme.NIGHT_SKY,
    randpix_1.RandpixColorScheme.SUNSET,
    randpix_1.RandpixColorScheme.TOXIC_LIME,
    randpix_1.RandpixColorScheme.SKY,
    randpix_1.RandpixColorScheme.BROWNSCALE,
    randpix_1.RandpixColorScheme.LIGHT_SEPIA,
    randpix_1.RandpixColorScheme.SUN,
    randpix_1.RandpixColorScheme.PURPLE_SOLARIZED,
    randpix_1.RandpixColorScheme.CYBERPUNK,
    randpix_1.RandpixColorScheme.DIAMOND_BLACK,
    randpix_1.RandpixColorScheme.CYBER_BLACK,
    randpix_1.RandpixColorScheme.DIAMOND,
    randpix_1.RandpixColorScheme.BLOOD_MOON,
    randpix_1.RandpixColorScheme.GERMANY,
    randpix_1.RandpixColorScheme.GOLD_ORE,
    randpix_1.RandpixColorScheme.LAVA_POOL,
    randpix_1.RandpixColorScheme.CREAM
];
const generateAvatar = (seed, saveAsImage) => __awaiter(void 0, void 0, void 0, function* () {
    const randomIndex = Math.floor(Math.random() * types.length);
    const randomType = types[randomIndex];
    const generate = (0, randpix_1.randpix)({
        colorScheme: randomType,
        size: 8,
        scale: 32,
        symmetry: randpix_1.Symmetry.VERTICAL,
        // color: [255, 100, 50], // [R, G, B] like color for solid art (default: undefined),
        seed,
        colorBias: 15,
        grayscaleBias: false // Change only the brightness of the color instead of the hue (default: undefined)
    });
    const art = generate(); // Generating the pixel art
    let data = {
        dataUrl: art.toDataURL()
    };
    if (saveAsImage) {
        const fileName = `avatar-${Date.now()}.png`;
        const filePath = path_1.default.join(__dirname, '../../public', 'avatars', fileName);
        const pngBuffer = art.toBuffer('image/png');
        // Write the PNG buffer to a file
        yield fs_1.default.writeFile(filePath, pngBuffer, err => {
            if (err) {
                console.error(err);
                return;
            }
        });
        data['imagePath'] = 'avatars/' + fileName;
    }
    return data;
});
exports.generateAvatar = generateAvatar;

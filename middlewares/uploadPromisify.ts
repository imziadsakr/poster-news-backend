import multer from 'multer'
import multerGoogleStorage from 'multer-google-storage'
import { v4 as uuidv4 } from 'uuid'
import * as util from 'util'
import dotenv from "dotenv";
dotenv.config();

const uploadConfig = multer({
  storage : new multerGoogleStorage({
    projectId : process.env.GCOULD_PROJECT_ID,
    keyFilename:`authKey/service_account_key.json`,
    bucket : process.env.GCLOUD_STORAGE_BUCKET,
    filename : (req : Request, file : any, cb : any) => {
      cb(null,`medias/${uuidv4()}_${file.mimetype.split("/")[0]}_${file.originalname}`);
    }
  }),
  limits : {
    fileSize : 15 * 1024 * 1024
  }
}).single('image')

const uploadGCP = util.promisify(uploadConfig);

export default uploadGCP ;
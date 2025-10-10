import { Router } from "express"
import * as fileManagerController from "../controller/file-manager.controller"
import multer from "multer"

const router = Router()
const upload = multer()

router.post("/upload", upload.array("files"), fileManagerController.upload)

export default router
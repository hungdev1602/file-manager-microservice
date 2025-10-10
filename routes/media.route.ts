import { Router } from "express"
import * as mediaController from "../controller/media.controller"

const router = Router()

router.get("/:filename", mediaController.getFile)

export default router
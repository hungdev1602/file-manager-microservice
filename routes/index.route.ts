import { Router } from "express"
import fileManagerRoutes from "./file-manager.route"
import mediaRoutes from "./media.route"

const router = Router()

router.use("/file-manager", fileManagerRoutes)

router.use("/media", mediaRoutes)

export default router
import { Router } from "express"
import fileManagerRoutes from "./file-manager.route"

const router = Router()

router.use("/file-manager", fileManagerRoutes)

export default router
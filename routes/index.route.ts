import { Router } from "express"
import fileManagerRoutes from "./file-manager.route"
import mediaRoutes from "./media.route"
import * as domainMiddleware from "../middlewares/domain.middleware"

const router = Router()

router.use("/file-manager", fileManagerRoutes)

router.use("/media", domainMiddleware.checkDomain, mediaRoutes)

export default router
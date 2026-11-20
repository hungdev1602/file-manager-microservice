import { Request, Response } from "express"
import path from "path"
import fs from "fs"
import crypto from "crypto"

// Thư mục chứa file gốc
const mediaDir = path.join(__dirname, "../media")

// Thư mục lưu ảnh đã thu nhỏ (tự tạo, đã .gitignore). Xoá thư mục này lúc nào cũng được, ảnh sẽ được tạo lại khi có người xem
const cacheDir = path.join(__dirname, "../cache/media")

// ===== Ảnh thu nhỏ: /media/abc.png?w=640 =====
// Ảnh gốc admin tải lên thường nặng 1-2 MB (PNG chụp màn hình, ảnh điện thoại). Trang danh sách sản phẩm chỉ cần ảnh
// rộng vài trăm px, nên server thu nhỏ ảnh theo ?w=... và đổi sang WebP (nhẹ hơn 10-30 lần), lưu lại để lần sau trả ngay.
// Không có ?w= thì trả file gốc như cũ. Video, GIF (ảnh động), SVG luôn trả file gốc.

// Chỉ thu nhỏ về các chiều rộng này (làm tròn lên), để không ai tạo ra vô số bản thu nhỏ khác nhau
const widthList = [160, 320, 480, 640, 960, 1280, 1920]
const resizableExtList = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".tif", ".tiff"]

// Trình duyệt được lưu ảnh 7 ngày, không phải hỏi lại server mỗi lần mở trang
// (tên file tải lên có thời gian ở đầu nên không bị trùng với file cũ)
const maxAge = 7 * 24 * 60 * 60 * 1000

// Thư viện thu nhỏ ảnh. Không tải được (cài thiếu) thì vẫn chạy bình thường, chỉ trả ảnh gốc
let sharp: any = null
try {
  sharp = require("sharp")
} catch (error) {
  console.log("Không tải được thư viện sharp (chạy lại yarn install), ảnh sẽ không được thu nhỏ:", error)
}

// ?w=500 => 640 (chiều rộng cho phép gần nhất, lớn hơn hoặc bằng)
const pickWidth = (value: unknown): number => {
  const width = Number(value)
  if(typeof value !== "string" || !Number.isFinite(width) || width <= 0) return 0
  return widthList.find(item => item >= width) || widthList[widthList.length - 1]
}

// Đang tạo ảnh thu nhỏ: nhiều người mở cùng lúc thì chỉ tạo 1 lần
const pendingList = new Map<string, Promise<string>>()

// Trả về đường dẫn ảnh thu nhỏ (tạo mới nếu chưa có). Ảnh gốc bị sửa / thay thì tên ảnh thu nhỏ cũng đổi theo
const getThumbnail = async (filePath: string, width: number, format: "webp" | "original"): Promise<string | null> => {
  const stat = await fs.promises.stat(filePath)
  if(!stat.isFile()) return null

  const key = crypto.createHash("sha1").update(`${filePath}|${stat.size}|${stat.mtimeMs}`).digest("hex")
  const ext = format === "webp" ? ".webp" : path.extname(filePath).toLowerCase()
  const thumbPath = path.join(cacheDir, `${key}-${width}${ext}`)

  if(fs.existsSync(thumbPath)) return thumbPath

  const pending = pendingList.get(thumbPath)
  if(pending) return pending

  const task = (async () => {
    await fs.promises.mkdir(cacheDir, { recursive: true })
    // Ghi ra file tạm rồi đổi tên, để không ai nhận được ảnh đang ghi dở
    const tempPath = path.join(cacheDir, `${key}-${width}.${process.pid}-${Date.now()}.tmp${ext}`)
    let image = sharp(filePath, { failOn: "none" })
      .rotate() // xoay đúng chiều theo thông tin EXIF (ảnh chụp bằng điện thoại)
      .resize({ width: width, withoutEnlargement: true }) // ảnh gốc nhỏ hơn thì giữ nguyên kích thước
    if(format === "webp") image = image.webp({ quality: 80 })
    else if(ext === ".jpg" || ext === ".jpeg") image = image.jpeg({ quality: 82, mozjpeg: true })
    try {
      await image.toFile(tempPath)
      await fs.promises.rename(tempPath, thumbPath)
    } catch (error) {
      await fs.promises.rm(tempPath, { force: true })
      throw error
    }
    return thumbPath
  })()

  pendingList.set(thumbPath, task)
  try {
    return await task
  } finally {
    pendingList.delete(thumbPath)
  }
}

export const getFile = async (req: Request, res: Response) => {
  const subPath = req.params.subPath as unknown as string[] // mảng các path con (ví dụ /media/folder 1/a.png => ["folder 1", "a.png"])
  const type = req.query.type

  const mediaPath = path.join(mediaDir, ...subPath) // đường dẫn đến file

  // Không cho đọc file nằm ngoài thư mục media (đường dẫn có "..")
  if(!mediaPath.startsWith(mediaDir + path.sep)) {
    res.status(404).send("Not found")
    return
  }

  if(type === "download"){
    res.download(mediaPath)
    return
  }

  const width = pickWidth(req.query.w)
  if(width && sharp && resizableExtList.includes(path.extname(mediaPath).toLowerCase())) {
    // Trình duyệt hỗ trợ WebP (hầu hết trình duyệt hiện nay) thì trả WebP, không thì giữ định dạng gốc
    const format = `${req.headers.accept || ""}`.includes("image/webp") ? "webp" : "original"
    try {
      const thumbPath = await getThumbnail(mediaPath, width, format)
      if(thumbPath) {
        res.sendFile(thumbPath, { maxAge: maxAge, headers: { "Vary": "Accept" } })
        return
      }
    } catch (error: any) {
      // Không có file (đã xoá, đổi tên) thì để sendFile bên dưới trả về 404 như cũ
      if(error?.code !== "ENOENT") console.log(`Không thu nhỏ được ảnh ${mediaPath}:`, error)
    }
  }

  res.sendFile(mediaPath, { maxAge: maxAge })
}

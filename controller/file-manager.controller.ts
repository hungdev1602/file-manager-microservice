import { Request, Response } from "express"
import path from "path"
import fs from "fs"

export const upload = (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[]

    const saveLinks: {
      folder: string,
      filename: string,
      mimetype: string,
      size: number
    }[] = []
    const mediaDir = path.join(__dirname, "../media")

    files.forEach(file => {
      const filename = `${Date.now()}-${file.originalname}`
      const savePath = path.join(mediaDir, filename)
      fs.writeFileSync(savePath, file.buffer) // lưu file vào mục media, tên file sẽ là savePath
      saveLinks.push({
        folder: "/media",
        filename: filename,
        mimetype: file.mimetype,
        size: file.size
      })
    })

    res.json({
      code: "success",
      message: "Upload thành công",
      saveLinks: saveLinks
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi upload"
    })
  }
}

export const changeFileName = async (req: Request, res: Response) => {
  try {
    const { folder, oldFileName, newFileName } = req.body

    if(!folder || !oldFileName || !newFileName){
      res.json({
        code: "error",
        message: "Thiếu thông tin cần thiết"
      })
    }

    // Đổi tên file
    // tạo đường dẫn đến file đó
    const cleanFolder = folder.replace("/", "") // loại bỏ dấu /
    const mediaDir = path.join(__dirname, "..", cleanFolder)
    const oldFilePath = path.join(mediaDir, oldFileName) // file cũ
    const newFilePath = path.join(mediaDir, newFileName) // file mới

    // check xem file cũ có tồn tại hay ko
    if(!fs.existsSync(oldFilePath)){
      res.json({
        code: "error",
        message: "File cũ không tìm thấy"
      })
      return
    }
    // check xem tên mới có tồn tại cùng folder hay ko
    if(fs.existsSync(newFilePath)){
      res.json({
        code: "error",
        message: "Tên File mới này đã tồn tại"
      })
      return
    }

    // Đổi tên file
    fs.renameSync(oldFilePath, newFilePath)

    res.json({
      code: "success",
      message: "Thành công"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi server khi đổi tên File"
    })
  }
}
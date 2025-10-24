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

export const deleteFilePatch = async (req: Request, res: Response) => {
  try {
    const { folder, fileName } = req.body

    if(!folder || !fileName){
      res.json({
        code: "error",
        message: "Thiếu thông tin cần thiết"
      })
    }

    // tạo đường dẫn đến file đó
    const cleanFolder = folder.replace("/", "") // loại bỏ dấu /
    const mediaDir = path.join(__dirname, "..", cleanFolder)
    const filePath = path.join(mediaDir, fileName) // file

    // check xem file cũ có tồn tại hay ko
    if(!fs.existsSync(filePath)){
      res.json({
        code: "error",
        message: "File cũ không tìm thấy"
      })
      return
    }

    // xoá file
    fs.unlinkSync(filePath)

    res.json({
      code: "success",
      message: "Xoá File thành công"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi server khi xóa File"
    })
  }
}

export const folderCreatePost = async (req: Request, res: Response) => {
  try {
    const { folderName, folderPath } = req.body

    if(!folderName || typeof folderName !== "string"){
      res.json({
        code: "error",
        message: "Thiếu tên Folder"
      })
      return
    }

    const mediaPath = path.join(__dirname, "..", "media") // Folder gốc để lưu mọi file
    const targetPath = path.join(mediaPath, folderPath || "", folderName) // Folder mới mà cần tạo
    
    if(fs.existsSync(targetPath)){ //check xem tồn tại tên Folder muốn tạo hay chưa
      res.json({
        code: "error",
        message: "Folder này đã tồn tại"
      })
      return
    }

    fs.mkdirSync(targetPath)

    res.json({
      code: "success",
      message: "Tạo Folder thành công"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi server khi tạo Folder FM"
    })
  }
}

export const listFolder = async (req: Request, res: Response) => {
  try {
    let mediaPath = path.join(__dirname, "..", "media") // Folder gốc lưu mọi file

    if(req.query.folderPath !== "undefined") {
      mediaPath = path.join(mediaPath, `${req.query.folderPath}`)
    }
    
    // Đọc danh sách file/folder trong media
    const items = fs.readdirSync(mediaPath)
    
    const folders: {
      name: string,
      createdAt: Date
    }[] = []

    items.forEach(item => {
      const itemPath = path.join(mediaPath, item)
      const itemInfo = fs.statSync(itemPath) // thông tin chi tiết của file/folder

      if(itemInfo.isDirectory()){ // nếu là Folder thì thêm vào mảng Folder
        folders.push({
          name: item,
          createdAt: itemInfo.birthtime
        })
      }
    })

    
    // Sắp xếp, cái nào tạo ra sau cùng thì cho lên trên cùng, làm giảm dần
    folders.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())

    res.json({
      code: "success",
      message: "Thành công!",
      listFolder: folders
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi server khi lấy danh sách Folder"
    })
  }
}
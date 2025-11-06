import { Request, Response } from "express"
import path from "path"

export const getFile = (req: Request, res: Response) => {
  const subPath = req.params.subPath // mảng các path con (ví dụ /media/folder 1 => ["media", "folder 1"])
  const type = req.query.type


  const mediaPath = path.join(__dirname, "../media", ...subPath) // đường dẫn đến file

  if(type === "download"){
    res.download(mediaPath)
  }
  else{
    res.sendFile(mediaPath)
  }
}
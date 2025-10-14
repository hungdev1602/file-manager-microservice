import { Request, Response } from "express"
import path from "path"

export const getFile = (req: Request, res: Response) => {
  const filename = req.params.filename
  const type = req.query.type

  const mediaPath = path.join(__dirname, "../media", filename) // đường dẫn đến file

  if(type === "download"){
    res.download(mediaPath)
  }
  else{
    res.sendFile(mediaPath)
  }
}
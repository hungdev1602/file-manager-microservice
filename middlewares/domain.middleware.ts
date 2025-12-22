import { NextFunction, Request, Response } from "express";

export const checkDomain = (req: Request, res: Response, next: NextFunction) => {
  const referer = req.headers.referer
  const allowOrigin = process.env.DOMAIN // các tên miền được phép truy cập

  if(referer !== allowOrigin){
    res.send("Truy cap ko hop le")
    return
  }
  next()
}
import { NextFunction } from 'express'
import { IResponse, IVerifyRequest } from '../Types'

export const customResponse = (
  req: IVerifyRequest,
  res: IResponse,
  next: NextFunction
): void => {
  res.sendResponse = (data: any, error: any, status = 200) => {
    if (error) {
      res.status(status).json({
        success: false,
        error: error
      })
    } else {
      res.status(status).json({
        success: true,
        data: data
      })
    }
  }
  next()
}

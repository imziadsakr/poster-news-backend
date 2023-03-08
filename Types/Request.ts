import { IUser } from '../models'
import { Request, Response } from 'express'

export interface IVerifyRequest extends Request {
  user?: IUser
}
export interface IResponse extends Response {
  sendResponse(data: any, error: any, status: number): void
}

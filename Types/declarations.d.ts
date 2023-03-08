import { Response } from "express";

declare module "express-serve-static-core" {
  interface Response extends Response {
    sendResponse(data: any, error: any, status: number): void;
  }
}

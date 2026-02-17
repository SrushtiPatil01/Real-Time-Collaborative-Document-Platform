import { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../types";

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("No token provided");
    }
    const token = header.split(" ")[1];
    const payload = verifyAccessToken(token);
    req.user = { id: payload.id, email: payload.email, username: payload.username };
    next();
  } catch (err: any) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}
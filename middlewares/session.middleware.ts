import { NextFunction, Request, Response } from "express";
import { SessionService } from "../services/mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      session?: any;
    }
  }
}

export function sessionMiddleware(sessionService: SessionService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    const sessionId = authHeader.substring(7);

    try {
      const session = await sessionService.findActiveSession(sessionId);
      if (!session) {
        return res.status(401).json({ error: "Invalid or expired session" });
      }

      req.user = session.user;
      req.session = session;
      next();
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

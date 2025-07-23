import { SessionService, UserService } from "../services/mongoose";
import { json, Request, Response, Router } from "express";
import { sessionMiddleware } from "../middlewares";
import { UserRole } from "../models";

export class AuthController {
  constructor(
    public readonly userService: UserService,
    public readonly sessionService: SessionService
  ) {}

  async login(req: Request, res: Response) {
    if (!req.body || !req.body.email || !req.body.password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    try {
      const user = await this.userService.findUser(
        req.body.email,
        req.body.password
      );
      if (!user || !user.isActive) {
        res
          .status(401)
          .json({ error: "Invalid credentials or account desactivated" });
        return;
      }

      const session = await this.sessionService.createSession({
        user: user._id,
        expirationDate: new Date(Date.now() + 1_296_000_000), // 15 jours
      });

      res.status(201).json({
        sessionId: session._id,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          totalScore: user.totalScore,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async register(req: Request, res: Response) {
    if (
      !req.body ||
      !req.body.email ||
      !req.body.password ||
      !req.body.firstName ||
      !req.body.lastName
    ) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    try {
      const user = await this.userService.createUser({
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: UserRole.USER,
        isActive: true,
        totalScore: 0,
      });

      res.status(201).json({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      res.status(409).json({ error: "User already exists or invalid data" });
    }
  }

  async me(req: Request, res: Response) {
    res.json({
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      totalScore: req.user.totalScore,
      badges: req.user.badges,
    });
  }

  async logout(req: Request, res: Response) {
    try {
      await this.sessionService.deleteSession(req.session._id);
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  buildRouter(): Router {
    const router = Router();
    router.post("/login", json(), this.login.bind(this));
    router.post("/register", json(), this.register.bind(this));
    router.get(
      "/me",
      sessionMiddleware(this.sessionService),
      this.me.bind(this)
    );
    router.post(
      "/logout",
      sessionMiddleware(this.sessionService),
      this.logout.bind(this)
    );
    return router;
  }
}

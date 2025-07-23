import { BadgeService, SessionService } from "../services/mongoose";
import { Request, Response, Router } from "express";
import { sessionMiddleware, superAdminMiddleware } from "../middlewares";
import { BadgeType } from "../models";

export class BadgeController {
  constructor(
    public readonly badgeService: BadgeService,
    public readonly sessionService: SessionService
  ) {}

  async getAllBadges(req: Request, res: Response) {
    try {
      const badges = await this.badgeService.getAllBadges();
      res.json(badges);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getActiveBadges(req: Request, res: Response) {
    try {
      const badges = await this.badgeService.getActiveBadges();
      res.json(badges);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getBadgeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const badge = await this.badgeService.getBadgeById(id);

      if (!badge) {
        res.status(404).json({ error: "Badge not found" });
        return;
      }

      res.json(badge);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async createBadge(req: Request, res: Response) {
    try {
      const { name, description, type, rules, points } = req.body;

      if (!name || !description || !type || !rules || !points) {
        res.status(400).json({
          error: "Name, description, type, rules and points are required",
        });
        return;
      }

      if (!Object.values(BadgeType).includes(type)) {
        res.status(400).json({ error: "Invalid badge type" });
        return;
      }

      if (!Array.isArray(rules) || rules.length === 0) {
        res.status(400).json({ error: "At least one rule is required" });
        return;
      }

      const badge = await this.badgeService.createBadge({
        name,
        description,
        type,
        rules,
        points,
        createdBy: req.user._id,
      });

      res.status(201).json({
        message: "Badge created successfully",
        badge,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(409).json({ error: "Badge with this name already exists" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  async updateBadge(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, type, rules, points } = req.body;

      if (!name && !description && !type && !rules && !points) {
        res
          .status(400)
          .json({ error: "At least one field is required to update" });
        return;
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (type) updateData.type = type;
      if (rules) updateData.rules = rules;
      if (points) updateData.points = points;

      const badge = await this.badgeService.updateBadge(id, updateData);

      if (!badge) {
        res.status(404).json({ error: "Badge not found" });
        return;
      }

      res.json({
        message: "Badge updated successfully",
        badge,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteBadge(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const deleted = await this.badgeService.deleteBadge(id);

      if (!deleted) {
        res.status(404).json({ error: "Badge not found" });
        return;
      }

      res.json({
        message: "Badge deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async toggleBadgeStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const badge = await this.badgeService.toggleBadgeStatus(id);

      if (!badge) {
        res.status(404).json({ error: "Badge not found" });
        return;
      }

      res.json({
        message: `Badge ${badge.isActive ? "activated" : "deactivated"} successfully`,
        badge,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getBadgesByType(req: Request, res: Response) {
    try {
      const { type } = req.params;

      if (!Object.values(BadgeType).includes(type as BadgeType)) {
        res.status(400).json({ error: "Invalid badge type" });
        return;
      }

      const badges = await this.badgeService.getBadgesByType(type as BadgeType);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  buildRouter(): Router {
    const router = Router();

    router.get("/", this.getAllBadges.bind(this));
    router.get("/active", this.getActiveBadges.bind(this));
    router.get("/type/:type", this.getBadgesByType.bind(this));
    router.get("/:id", this.getBadgeById.bind(this));

    router.post(
      "/",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.createBadge.bind(this)
    );

    router.put(
      "/:id",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.updateBadge.bind(this)
    );

    router.delete(
      "/:id",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.deleteBadge.bind(this)
    );

    router.patch(
      "/:id/toggle-status",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.toggleBadgeStatus.bind(this)
    );

    return router;
  }
}

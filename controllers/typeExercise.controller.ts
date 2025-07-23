import { TypeExerciseService, SessionService } from "../services/mongoose";
import { Request, Response, Router } from "express";
import { sessionMiddleware, superAdminMiddleware } from "../middlewares";

export class TypeExerciseController {
  constructor(
    public readonly typeExerciseService: TypeExerciseService,
    public readonly sessionService: SessionService
  ) {}

  async getAllTypeExercises(req: Request, res: Response) {
    try {
      const typeExercises =
        await this.typeExerciseService.getAllTypeExercises();
      res.json(typeExercises);
    } catch (error) {
      console.error("Error getting type exercises:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getTypeExerciseById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const typeExercise =
        await this.typeExerciseService.getTypeExerciseById(id);

      if (!typeExercise) {
        res.status(404).json({ error: "Type exercise not found" });
        return;
      }

      res.json(typeExercise);
    } catch (error) {
      console.error("Error getting type exercise:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async createTypeExercise(req: Request, res: Response) {
    try {
      const { name, description, targetedMuscles } = req.body;

      if (!name || !targetedMuscles || targetedMuscles.length === 0) {
        res
          .status(400)
          .json({ error: "Name and targeted muscles are required" });
        return;
      }

      const typeExercise = await this.typeExerciseService.createTypeExercise({
        name,
        description,
        targetedMuscles,
        createdBy: req.user._id,
      });

      res.status(201).json({
        message: "Type exercise created successfully",
        typeExercise,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateTypeExercise(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, targetedMuscles } = req.body;

      if (!name && !description && !targetedMuscles) {
        res
          .status(400)
          .json({ error: "At least one field is required to update" });
        return;
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (targetedMuscles) updateData.targetedMuscles = targetedMuscles;

      const typeExercise = await this.typeExerciseService.updateTypeExercise(
        id,
        updateData
      );

      if (!typeExercise) {
        res.status(404).json({ error: "Type exercise not found" });
        return;
      }

      res.json({
        message: "Type exercise updated successfully",
        typeExercise,
      });
    } catch (error) {
      console.error("Error updating type exercise:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteTypeExercise(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const deleted = await this.typeExerciseService.deleteTypeExercise(id);

      if (!deleted) {
        res.status(404).json({ error: "Type exercise not found" });
        return;
      }

      res.json({
        message: "Type exercise deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting type exercise:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // SEARCH type exercises by muscle
  async searchByMuscle(req: Request, res: Response) {
    try {
      const { muscle } = req.query;

      if (!muscle) {
        res.status(400).json({ error: "Muscle parameter is required" });
        return;
      }

      const typeExercises =
        await this.typeExerciseService.getTypeExercisesByMuscle(
          muscle as string
        );
      res.json(typeExercises);
    } catch (error) {
      console.error("Error searching type exercises by muscle:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  buildRouter(): Router {
    const router = Router();

    router.get("/", this.getAllTypeExercises.bind(this));

    router.get("/search", this.searchByMuscle.bind(this));

    router.get("/:id", this.getTypeExerciseById.bind(this));

    router.post(
      "/",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.createTypeExercise.bind(this)
    );

    router.put(
      "/:id",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.updateTypeExercise.bind(this)
    );

    router.delete(
      "/:id",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.deleteTypeExercise.bind(this)
    );

    return router;
  }
}

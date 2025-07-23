import { GymService, SessionService, UserService } from "../services/mongoose";
import { Request, Response, Router } from "express";
import {
  sessionMiddleware,
  superAdminMiddleware,
  userMiddleware,
  gymOwnerMiddleware,
  AdminOrGymOwnerMiddleware,
} from "../middlewares";
import { UserRole, GymStatus } from "../models";

export class GymController {
  constructor(
    public readonly gymService: GymService,
    public readonly sessionService: SessionService,
    public readonly userService: UserService
  ) {}

  async getAllGyms(req: Request, res: Response) {
    try {
      const gyms = await this.gymService.getAllGyms();
      res.json(gyms);
    } catch (error) {
      console.error("Error getting gyms:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async createGym(req: Request, res: Response) {
    try {
      if (
        req.user.role !== UserRole.SUPER_ADMIN &&
        req.user.role !== UserRole.GYM_OWNER
      ) {
        res
          .status(403)
          .json({ error: "Super Admin ou Gym Owner peuvent créer des gyms" });
        return;
      }

      const { name, location, description, ownerId } = req.body;
      if (!name || !location) {
        res.status(400).json({ error: "Name and location are required" });
        return;
      }

      const status =
        req.user.role === UserRole.SUPER_ADMIN
          ? GymStatus.APPROVED
          : GymStatus.PENDING;
      const finalOwnerId = ownerId || req.user._id;

      // Message selon le status
      const message =
        status === GymStatus.APPROVED
          ? "Gym created and approved successfully"
          : "Gym created and pending admin approval";

      const gym = await this.gymService.createGym({
        name,
        location,
        description,
        status,
        createdBy: req.user._id,
        ownerId: finalOwnerId,
      });

      res.status(201).json({
        message,
        gym,
      });
    } catch (error) {
      console.error("Error creating gym:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getPendingGyms(req: Request, res: Response) {
    try {
      const gyms = await this.gymService.getPendingGyms();
      res.json(gyms);
    } catch (error) {
      console.error("Error getting pending gyms:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getMyGyms(req: Request, res: Response) {
    try {
      let gyms: any[] = [];

      // Si c'est un GYM_OWNER, récupérer les gyms dont il est propriétaire
      if (req.user.role === UserRole.GYM_OWNER) {
        const ownedGyms = await this.gymService.getGymsByOwner(req.user._id);
        gyms = ownedGyms;
      }

      // Récupérer aussi la gym assignée via gymId (pour tous les rôles)
      const user = await this.userService.findUserById(req.user._id);
      if (user && user.gymId) {
        const assignedGym = await this.gymService.getGymById(user.gymId);
        if (assignedGym) {
          // Pour GYM_OWNER, éviter les doublons si gymId = ownerId
          const alreadyIncluded = gyms.some(
            (gym) => gym._id.toString() === assignedGym._id.toString()
          );
          if (!alreadyIncluded) {
            gyms.push(assignedGym);
          }
        }
      }

      res.json(gyms);
    } catch (error) {
      console.error("Error getting my gyms:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async assignGymToOwner(req: Request, res: Response) {
    try {
      const { gymId } = req.params;
      const { ownerId } = req.body;

      if (!ownerId) {
        res.status(400).json({ error: "Owner ID is required" });
        return;
      }

      const gym = await this.gymService.assignGymToOwner(
        gymId,
        ownerId,
        req.user._id
      );

      if (!gym) {
        res.status(404).json({ error: "Gym not found" });
        return;
      }

      res.json({
        message: "Gym assigned to owner and approved successfully",
        gym,
      });
    } catch (error) {
      console.error("Error assigning gym to owner:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async approveGym(req: Request, res: Response) {
    try {
      const { gymId } = req.params;

      const gym = await this.gymService.approveGym(gymId, req.user._id);

      if (!gym) {
        res.status(404).json({ error: "Gym not found" });
        return;
      }

      res.json({
        message: "Gym approved successfully",
        gym,
      });
    } catch (error) {
      console.error("Error approving gym:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async rejectGym(req: Request, res: Response) {
    try {
      const { gymId } = req.params;

      const gym = await this.gymService.rejectGym(gymId);

      if (!gym) {
        res.status(404).json({ error: "Gym not found" });
        return;
      }

      res.json({
        message: "Gym rejected successfully",
        gym,
      });
    } catch (error) {
      console.error("Error rejecting gym:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateGym(req: Request, res: Response) {
    try {
      const { gymId } = req.params;
      const {
        name,
        location,
        description,
        capacity,
        equipment,
        difficultyLevels,
      } = req.body;

      if (
        !name &&
        !location &&
        !description &&
        !capacity &&
        !equipment &&
        !difficultyLevels
      ) {
        res
          .status(400)
          .json({ error: "At least one field is required to update" });
        return;
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (location) updateData.location = location;
      if (description) updateData.description = description;
      if (capacity) updateData.capacity = capacity;
      if (equipment) updateData.equipment = equipment;
      if (difficultyLevels) updateData.difficultyLevels = difficultyLevels;

      const gym = await this.gymService.updateGym(gymId, updateData);

      if (!gym) {
        res.status(404).json({ error: "Gym not found" });
        return;
      }

      res.json({
        message: "Gym updated successfully",
        gym,
      });
    } catch (error) {
      console.error("Error updating gym:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteGym(req: Request, res: Response) {
    try {
      const { gymId } = req.params;

      const deleted = await this.gymService.deleteGym(gymId);

      if (!deleted) {
        res.status(404).json({ error: "Gym not found" });
        return;
      }

      res.json({
        message: "Gym deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting gym:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async assignTypeExercisesToGym(req: Request, res: Response) {
    try {
      const { gymId } = req.params;
      const { typeExerciseIds } = req.body;

      if (!typeExerciseIds || !Array.isArray(typeExerciseIds)) {
        res.status(400).json({ error: "Type exercise IDs array is required" });
        return;
      }

      const gym = await this.gymService.assignTypeExercisesToGym(
        gymId,
        typeExerciseIds
      );

      if (!gym) {
        res.status(404).json({ error: "Gym not found" });
        return;
      }

      res.json({
        message: "Type exercises assigned to gym successfully",
        gym,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async addTypeExerciseToGym(req: Request, res: Response) {
    try {
      const { gymId } = req.params;
      const { typeExerciseId } = req.body;

      if (!typeExerciseId) {
        res.status(400).json({ error: "Type exercise ID is required" });
        return;
      }

      const gym = await this.gymService.addTypeExerciseToGym(
        gymId,
        typeExerciseId
      );

      if (!gym) {
        res.status(404).json({ error: "Gym not found" });
        return;
      }

      res.json({
        message: "Type exercise added to gym successfully",
        gym,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async removeTypeExerciseFromGym(req: Request, res: Response) {
    try {
      const { gymId, typeExerciseId } = req.params;

      const gym = await this.gymService.removeTypeExerciseFromGym(
        gymId,
        typeExerciseId
      );

      if (!gym) {
        res.status(404).json({ error: "Gym not found" });
        return;
      }

      res.json({
        message: "Type exercise remove success",
        gym,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getGymsByTypeExercise(req: Request, res: Response) {
    try {
      const { typeExerciseId } = req.params;

      const gyms = await this.gymService.getGymsByTypeExercise(typeExerciseId);
      res.json(gyms);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async assignUserToGym(req: Request, res: Response) {
    try {
      const { gymId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const gym = await this.gymService.getGymById(gymId);
      if (!gym) {
        res.status(404).json({ error: "Gym not found" });
        return;
      }

      if (req.user.role === UserRole.GYM_OWNER) {
        // Gym Owner peut seulement assigner à sa propre gym
        if (gym.ownerId !== req.user._id) {
          res
            .status(403)
            .json({ error: "You can only assign users to your own gym" });
          return;
        }
      }

      const updatedUser = await this.userService.assignUserToGym(userId, gymId);

      if (!updatedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        message: "User assigned to gym successfully",
        user: {
          _id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          gymId: updatedUser.gymId,
        },
      });
    } catch (error) {
      console.error("Error assigning user to gym:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async removeUserFromGym(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const user = await this.userService.findUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (!user.gymId) {
        res.status(400).json({ error: "User is not assigned to any gym" });
        return;
      }

      if (req.user.role === UserRole.GYM_OWNER) {
        if (user.gymId !== req.user.gymId) {
          res
            .status(403)
            .json({ error: "You can only remove users from your own gym" });
          return;
        }
      }

      const updatedUser = await this.userService.removeUserFromGym(userId);

      res.json({
        message: "User removed from gym successfully",
        user: {
          _id: updatedUser?._id,
          firstName: updatedUser?.firstName,
          lastName: updatedUser?.lastName,
          email: updatedUser?.email,
        },
      });
    } catch (error) {
      console.error("Error removing user from gym:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getGymUsers(req: Request, res: Response) {
    try {
      const { gymId } = req.params;

      const gym = await this.gymService.getGymById(gymId);
      if (!gym) {
        res.status(404).json({ error: "Gym not found" });
        return;
      }

      if (req.user.role === UserRole.GYM_OWNER) {
        if (gym.ownerId !== req.user._id) {
          res
            .status(403)
            .json({ error: "You can only view users of your own gym" });
          return;
        }
      }

      const users = await this.userService.getUsersByGym(gymId);

      res.json(users);
    } catch (error) {
      console.error("Error getting gym users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  buildRouter(): Router {
    const router = Router();

    router.get("/", this.getAllGyms.bind(this));

    router.get(
      "/pending",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware,
      this.getPendingGyms.bind(this)
    );

    router.get(
      "/my-gyms",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.getMyGyms.bind(this)
    );

    router.post(
      "/",
      sessionMiddleware(this.sessionService),
      AdminOrGymOwnerMiddleware(),
      this.createGym.bind(this)
    );

    router.post(
      "/:gymId/assign-owner",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.assignGymToOwner.bind(this)
    );

    router.patch(
      "/:gymId/approve",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.approveGym.bind(this)
    );

    router.patch(
      "/:gymId/reject",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.rejectGym.bind(this)
    );

    router.put(
      "/:gymId",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.updateGym.bind(this)
    );

    // Delete gym (Super Admin only)
    router.delete(
      "/:gymId",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.deleteGym.bind(this)
    );

    // Search gyms by type exercise
    router.get(
      "/by-type-exercise/:typeExerciseId",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.getGymsByTypeExercise.bind(this)
    );

    router.post(
      "/:gymId/assign-type-exercises",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.assignTypeExercisesToGym.bind(this)
    );

    // Add type exercise to gym (Super Admin only)
    router.post(
      "/:gymId/add-type-exercise",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.addTypeExerciseToGym.bind(this)
    );

    router.delete(
      "/:gymId/type-exercises/:typeExerciseId",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.removeTypeExerciseFromGym.bind(this)
    );

    // Assign user to gym (Super Admin or Gym Owner)
    router.post(
      "/:gymId/assign-user",
      sessionMiddleware(this.sessionService),
      AdminOrGymOwnerMiddleware(),
      this.assignUserToGym.bind(this)
    );

    router.delete(
      "/users/:userId",
      sessionMiddleware(this.sessionService),
      AdminOrGymOwnerMiddleware(),
      this.removeUserFromGym.bind(this)
    );

    // Get users assigned to a gym (Super Admin or Gym Owner)
    router.get(
      "/:gymId/users",
      sessionMiddleware(this.sessionService),
      AdminOrGymOwnerMiddleware(),
      this.getGymUsers.bind(this)
    );

    return router;
  }
}

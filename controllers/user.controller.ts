import { UserService, SessionService } from "../services/mongoose";
import { Request, Response, Router } from "express";
import {
  sessionMiddleware,
  superAdminMiddleware,
  userMiddleware,
  AdminOrGymOwnerMiddleware
} from "../middlewares";
import { UserRole } from "../models";

export class UserController {
  constructor(
    public readonly userService: UserService,
    public readonly sessionService: SessionService
  ) {}

  async getProfile(req: Request, res: Response) {
    try {
      const user = await this.userService.findUserById(req.user._id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        totalScore: user.totalScore,
        badges: user.badges,
        isActive: user.isActive,
        friends: user.friends || [],
        challengesCompleted: user.challengesCompleted || 0,
        totalCaloriesBurned: user.totalCaloriesBurned || 0,
        streakDays: user.streakDays || 0,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const allowedUpdates = ["firstName", "lastName"];
      const updates: any = {};

      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const user = await this.userService.updateUser(req.user._id, updates);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        totalScore: user.totalScore,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getLeaderboard(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const users = await this.userService.getLeaderboard(limit);

      const leaderboard = users.map((user, index) => ({
        rank: index + 1,
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        totalScore: user.totalScore,
        badges: user.badges?.length || 0,
      }));

      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async desactivateUser(req: Request, res: Response) {
    try {
      const user = await this.userService.desactivateUser(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ message: "User desactivated successfully", user });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async activateUser(req: Request, res: Response) {
    try {
      const user = await this.userService.activateUser(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ message: "User activated successfully", user });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const deleted = await this.userService.deleteUser(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ message: "User deleted permanently" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Filtres optionnels
      const filters: any = {};
      if (req.query.role) {
        filters.role = req.query.role;
      }
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === "true";
      }

      const users = await this.userService.getAllUsers(filters, limit, skip);
      const stats = await this.userService.getUserStats();

      res.json({
        users,
        stats,
        pagination: {
          page,
          limit,
          total: stats.totalUsers,
        },
      });
    } catch (error) {
      console.error("Error getting all users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async promoteToGymOwner(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { gymId } = req.body;

      const user = await this.userService.updateUser(id, {
        role: UserRole.GYM_OWNER,
        gymId,
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        message: "User promoted to gym owner successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          gymId: user.gymId,
        },
      });
    } catch (error) {
      console.error("Error promoting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async promoteToSuperAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await this.userService.updateUser(id, {
        role: UserRole.SUPER_ADMIN,
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        message: "User promoted to super admin successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error promoting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async addFriend(req: Request, res: Response) {
    try {
      const { friendId } = req.params;

      if (friendId === req.user._id) {
        res.status(400).json({ error: "Cannot add yourself as friend" });
        return;
      }

      const friend = await this.userService.findUserById(friendId);
      if (!friend) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (!friend.isActive) {
        res.status(400).json({ error: "Cannot add inactive user as friend" });
        return;
      }

      const updatedUser = await this.userService.addFriend(
        req.user._id,
        friendId
      );
      if (!updatedUser) {
        console.log("Failed to add friend");
        res.status(500).json({ error: "Failed to add friend" });
        return;
      }

      console.log(
        "Friend added successfully, user friends:",
        updatedUser.friends
      );

      res.json({
        message: "Friend added successfully",
        friend: {
          id: friend._id,
          firstName: friend.firstName,
          lastName: friend.lastName,
          email: friend.email,
        },
        friendsCount: updatedUser.friends?.length || 0,
      });
    } catch (error) {
      console.error("Error adding friend:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getFriends(req: Request, res: Response) {
    try {
      const friends = await this.userService.getFriends(req.user._id);
      res.json(friends);
    } catch (error) {
      console.error("Error getting friends:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async removeFriend(req: Request, res: Response) {
    try {
      const { friendId } = req.params;

      const updatedUser = await this.userService.removeFriend(
        req.user._id,
        friendId
      );
      if (!updatedUser) {
        res.status(404).json({ error: "Friend not found or user not found" });
        return;
      }

      res.json({ message: "Friend removed successfully" });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  buildRouter(): Router {
    const router = Router();

    // Routes utilisateur
    router.get(
      "/profile",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.getProfile.bind(this)
    );
    router.put(
      "/profile",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.updateProfile.bind(this)
    );
    // Routes amis
    router.post(
      "/friends/:friendId",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.addFriend.bind(this)
    );
    router.get(
      "/friends",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.getFriends.bind(this)
    );
    router.delete(
      "/friends/:friendId",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.removeFriend.bind(this)
    );

    router.get("/leaderboard", this.getLeaderboard.bind(this));

    // Routes super admin
    router.get(
      "/",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.getAllUsers.bind(this)
    );
    router.post(
      "/:id/desactivate",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.desactivateUser.bind(this)
    );
    router.post(
      "/:id/activate",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.activateUser.bind(this)
    );
    router.delete(
      "/:id",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.deleteUser.bind(this)
    );
    router.post(
      "/:id/promote-gym-owner",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.promoteToGymOwner.bind(this)
    );
    router.post(
      "/:id/promote-super-admin",
      sessionMiddleware(this.sessionService),
      superAdminMiddleware(),
      this.promoteToSuperAdmin.bind(this)
    );


    return router;
  }
}

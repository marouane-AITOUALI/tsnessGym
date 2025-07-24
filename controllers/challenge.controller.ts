import {
  ChallengeService,
  ParticipationService,
  SessionService,
  UserService,
  BadgeService,
  GymService
} from "../services/mongoose";
import { Request, Response, Router } from "express";
import {
  sessionMiddleware,
  superAdminMiddleware,
  userMiddleware,
} from "../middlewares";
import { UserRole, ChallengeStatus, ParticipationStatus } from "../models";
import { checkAndAssignBadges } from "../utils/checkAndAssignBadges";

export class ChallengeController {
  constructor(
    public readonly challengeService: ChallengeService,
    public readonly participationService: ParticipationService,
    public readonly sessionService: SessionService,
    public readonly userService: UserService,
    public readonly badgeService: BadgeService,
    public readonly gymService: GymService
  ) {}

  // CREATE challenge
  async createChallenge(req: Request, res: Response) {
    try {
      const {
        title,
        description,
        gymId,
        exercises,
        goals,
        difficulty,
        type,
        duration,
        maxParticipants,
        rewards,
        estimatedCaloriesBurn,
        tags,
        isPublic,
        inviteOnly,
        teamBased,
      } = req.body;

      if (
        !title ||
        !description ||
        !exercises ||
        !goals ||
        !difficulty ||
        !duration
      ) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      let finalGymId = gymId;
      
      if (req.user.role === UserRole.GYM_OWNER) {
        const gym = await this.gymService.getGymByOwnerId(req.user._id);
        if (!gym) {
          res
            .status(400)
            .json({ error: "Gym owner must be associated with a gym" });
          return;
        }
        finalGymId = gym._id;
      } else if (req.user.role === UserRole.USER && gymId) {
        res
          .status(403)
          .json({
            error: "Only gym owners can create gym-specific challenges",
          });
        return;
      }
      const challenge = await this.challengeService.createChallenge({
        title,
        description,
        createdBy: req.user._id,
        gymId: finalGymId,
        exercises,
        goals,
        difficulty,
        type,
        duration,
        maxParticipants,
        rewards,
        estimatedCaloriesBurn,
        tags,
        isPublic,
        inviteOnly,
        teamBased,
      });

      res.status(201).json({
        message: "Challenge created successfully",
        challenge,
      });
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getPublicChallenges(req: Request, res: Response) {
    try {
      const challenges = await this.challengeService.getPublicChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Error getting public challenges:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async searchChallenges(req: Request, res: Response) {
    try {
      const { q, difficulty, type } = req.query;

      if (!q) {
        res.status(400).json({ error: "Search term is required" });
        return;
      }

      const challenges = await this.challengeService.searchChallenges(
        q as string,
        { difficulty: difficulty as any, type: type as any }
      );

      res.json(challenges);
    } catch (error) {
      console.error("Error searching challenges:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getChallengeById(req: Request, res: Response) {
    try {
      const { challengeId } = req.params;
      const challenge =
        await this.challengeService.getChallengeById(challengeId);

      if (!challenge) {
        res.status(404).json({ error: "Challenge not found" });
        return;
      }

      res.json(challenge);
    } catch (error) {
      console.error("Error getting challenge:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getMyChallenges(req: Request, res: Response) {
    try {
      const challenges = await this.challengeService.getAllChallenges({
        createdBy: req.user._id,
      });
      res.json(challenges);
    } catch (error) {
      console.error("Error getting my challenges:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async joinChallenge(req: Request, res: Response) {
    try {
      const { challengeId } = req.params;
      const { teamId } = req.body;

      const challenge =
        await this.challengeService.getChallengeById(challengeId);
      if (!challenge) {
        res.status(404).json({ error: "Challenge not found" });
        return;
      }

      const existingParticipation =
        await this.participationService.getUserChallengeParticipation(
          req.user._id,
          challengeId
        );

      if (existingParticipation) {
        res.status(400).json({ error: "Already joined this challenge" });
        return;
      }

      if (
        challenge.maxParticipants &&
        challenge.currentParticipants >= challenge.maxParticipants
      ) {
        res.status(400).json({ error: "Challenge is full" });
        return;
      }

      const participation = await this.participationService.createParticipation(
        {
          userId: req.user._id,
          challengeId,
          teamId,
        }
      );

      await this.challengeService.incrementParticipants(challengeId);

      res.status(201).json({
        message: "Successfully joined challenge",
        participation,
      });
    } catch (error) {
      console.error("Error joining challenge:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getMyParticipations(req: Request, res: Response) {
    try {
      const participations =
        await this.participationService.getUserParticipations(req.user._id);
      res.json(participations);
    } catch (error) {
      console.error("Error getting participations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // UPDATE progress
  async updateProgress(req: Request, res: Response) {
    try {
      const { participationId } = req.params;
      const { progress } = req.body;

      if (progress < 0 || progress > 100) {
        res.status(400).json({ error: "Progress must be between 0 and 100" });
        return;
      }

      // Vérifier que la participation appartient à l'utilisateur
      const participation =
        await this.participationService.getParticipationById(participationId);
      
      if (!participation) {
        res.status(404).json({ error: "Participation not found" });
        return;
      }
      
      // Vérifier si userId est populé (objet) ou simple ID (string)
      const participationUserId = (participation.userId as any)._id 
        ? (participation.userId as any)._id.toString() 
        : participation.userId.toString();
      
      if (participationUserId !== req.user._id.toString()) {
        res.status(404).json({ error: "Participation not found" });
        return;
      }

      // Mettre à jour le progrès
      const updatedParticipation =
        await this.participationService.updateProgress(
          participationId,
          progress
        );

      // Si le défi est terminé,
      if (progress >= 100) {
        await this.userService.updateUserStats(req.user._id, {
          challengesCompleted: 1,
          totalCaloriesBurned: participation.totalCalories,
          lastActivityDate: new Date(),
        });

        // Lancer la vérification des badges en arrière-plan
        checkAndAssignBadges(
          req.user._id,
          this.badgeService,
          this.userService
        ).catch((error) => console.error("Error checking badges:", error));
      }

      res.json({
        message: "Progress updated successfully",
        participation: updatedParticipation,
      });
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // ADD workout session
  async addWorkoutSession(req: Request, res: Response) {
    try {
      const { participationId } = req.params;
      const { exercises, caloriesBurned, notes } = req.body;

      if (!exercises || !Array.isArray(exercises)) {
        res.status(400).json({ error: "Exercises array is required" });
        return;
      }

      // Vérifier que la participation appartient à l'utilisateur
      const participation =
        await this.participationService.getParticipationById(participationId);
      if (!participation || participation.userId.toString() !== req.user._id) {
        res.status(404).json({ error: "Participation not found" });
        return;
      }

      const workoutSession = {
        date: new Date(),
        exercises,
        totalDuration: 0, // Calculé automatiquement par le service
        totalCalories: caloriesBurned || 0,
        notes,
      };

      const updatedParticipation =
        await this.participationService.addWorkoutSession(
          participationId,
          workoutSession
        );

      res.json({
        message: "Workout session added successfully",
        participation: updatedParticipation,
      });
    } catch (error) {
      console.error("Error adding workout session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getChallengeLeaderboard(req: Request, res: Response) {
    try {
      const { challengeId } = req.params;
      const leaderboard =
        await this.participationService.getLeaderboard(challengeId);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET user stats
  async getUserChallengeStats(req: Request, res: Response) {
    try {
      const stats = await this.participationService.getUserStats(req.user._id);
      res.json(stats);
    } catch (error) {
      console.error("Error getting user stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // ACTIVATE challenge (creator only)
  async activateChallenge(req: Request, res: Response) {
    try {
      const { challengeId } = req.params;

      const challenge =
        await this.challengeService.getChallengeById(challengeId);
      if (!challenge) {
        res.status(404).json({ error: "Challenge not found" });
        return;
      }

      // Vérifier que l'utilisateur est le créateur ou admin
      if (
        challenge.createdBy.toString() !== req.user._id &&
        req.user.role !== UserRole.SUPER_ADMIN
      ) {
        res
          .status(403)
          .json({
            error: "Only challenge creator or admin can activate challenge",
          });
        return;
      }

      const activatedChallenge =
        await this.challengeService.activateChallenge(challengeId);

      res.json({
        message: "Challenge activated successfully",
        challenge: activatedChallenge,
      });
    } catch (error) {
      console.error("Error activating challenge:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  buildRouter(): Router {
    const router = Router();

    // Public routes
    router.get("/public", this.getPublicChallenges.bind(this));
    router.get(
      "/search",
      sessionMiddleware(this.sessionService),
      this.searchChallenges.bind(this)
    );
    router.get(
      "/:challengeId",
      sessionMiddleware(this.sessionService),
      this.getChallengeById.bind(this)
    );
    router.get(
      "/:challengeId/leaderboard",
      sessionMiddleware(this.sessionService),
      this.getChallengeLeaderboard.bind(this)
    );

    // Authenticated user routes
    router.post(
      "/",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.createChallenge.bind(this)
    );
    router.get(
      "/my/challenges",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.getMyChallenges.bind(this)
    );
    router.get(
      "/my/participations",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.getMyParticipations.bind(this)
    );
    router.get(
      "/my/stats",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.getUserChallengeStats.bind(this)
    );

    // Challenge participation
    router.post(
      "/:challengeId/join",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.joinChallenge.bind(this)
    );
    router.patch(
      "/participations/:participationId/progress",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.updateProgress.bind(this)
    );
    router.post(
      "/participations/:participationId/workout",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.addWorkoutSession.bind(this)
    );

    // Challenge management
    router.patch(
      "/:challengeId/activate",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.activateChallenge.bind(this)
    );

    return router;
  }
}

import express from "express";
import { config } from "dotenv";
import { openConnection } from "./services/mongoose";
import {
  AuthController,
  UserController,
  GymController,
  TypeExerciseController,
  BadgeController,
  ChallengeController,
} from "./controllers";
import { InvitationController } from "./controllers/invitation.controller";
import {
  UserService,
  SessionService,
  GymService,
  TypeExerciseService,
  BadgeService,
  ChallengeService,
  ParticipationService,
} from "./services/mongoose";
import { InvitationService } from "./services/mongoose/services/invitation.service";
import { sessionMiddleware } from "./middlewares";
import { UserRole } from "./models";

// Charger les variables d'environnement
config();

async function initializeSuperAdmin(userService: UserService) {
  try {
    // Vérifier si un super admin existe déjà
    const existingSuperAdmin = await userService.findSuperAdmin();

    if (existingSuperAdmin) {
      console.log("Super Admin already exists:", existingSuperAdmin.email);
      return;
    } // Créer le super admin par défaut
    const defaultSuperAdmin = {
      email: process.env.SUPER_ADMIN_EMAIL || "admin@fitchallenge.com",
      password: process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!",
      firstName: "Super",
      lastName: "Admin",
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      totalScore: 0,
      challengesCompleted: 0,
      totalCaloriesBurned: 0,
      streakDays: 0,
    };

    const superAdmin = await userService.createUser(defaultSuperAdmin);
    console.log("Super Admin created successfully!");
    console.log("Email:", superAdmin.email);
    console.log("Password:", defaultSuperAdmin.password);
    console.log("Please change the password after first login!");
  } catch (error) {
    console.error("Error creating Super Admin:", error);
  }
}

async function main() {
  try {
    // Connexion à MongoDB
    console.log("Connecting to MongoDB...");
    const connection = await openConnection();
    console.log("Connected to MongoDB successfully");

    // Initialisation des services
    const userService = new UserService(connection);
    const sessionService = new SessionService(connection);
    const gymService = new GymService(connection);
    const typeExerciseService = new TypeExerciseService(connection);
    const badgeService = new BadgeService(connection);
    const challengeService = new ChallengeService(connection);
    const participationService = new ParticipationService(connection);
    const invitationService = new InvitationService(connection);

    // Initialisation du Super Admin (première fois seulement)
    await initializeSuperAdmin(userService);

    // Initialisation des contrôleurs
    const authController = new AuthController(userService, sessionService);
    const userController = new UserController(userService, sessionService);
    const gymController = new GymController(gymService, sessionService, userService);
    const typeExerciseController = new TypeExerciseController(
      typeExerciseService,
      sessionService
    );
    const badgeController = new BadgeController(badgeService, sessionService);
    const challengeController = new ChallengeController(
      challengeService,
      participationService,
      sessionService,
      userService,
      badgeService,
      gymService
    );
    const invitationController = new InvitationController(
      invitationService,
      challengeService,
      participationService,
      sessionService,
      userService
    );

    // Configuration d'Express
    const app = express();

    // Middleware global
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Routes
    app.use("/api/auth", authController.buildRouter());
    app.use("/api/users", userController.buildRouter());
    app.use("/api/gyms", gymController.buildRouter());
    app.use("/api/type-exercises", typeExerciseController.buildRouter());
    app.use("/api/badges", badgeController.buildRouter());
    app.use("/api/challenges", challengeController.buildRouter());
    app.use("/api", invitationController.buildRouter());

    // Route de santé
    app.get("/health", (req, res) => {
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        service: "FitChallenge API",
      });
    });

    // Démarrage du serveur
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`FitChallenge API server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch(console.error);

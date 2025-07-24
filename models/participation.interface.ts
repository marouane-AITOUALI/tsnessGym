import { Document } from "mongoose";
import { Timestamps } from "./timestamps";

export enum ParticipationStatus {
  JOINED = "JOINED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
}

export interface WorkoutSession {
  date: Date;
  exercises: {
    exerciseId: string;
    sets?: number;
    reps?: number;
    duration?: number;
    weight?: number;
    distance?: number;
    caloriesBurned?: number;
    completed: boolean;
  }[];
  totalDuration: number; // durée totale de la session en minutes
  totalCalories: number;
  notes?: string;
}

export interface ChallengeParticipation extends Document, Timestamps {
  _id: string;
  challengeId: string;
  userId: string;
  
  // Statut et progression
  status: ParticipationStatus;
  progress: number; // pourcentage de completion (0-100)
  
  // Sessions d'entraînement
  workoutSessions: WorkoutSession[];
  
  // Dates
  joinedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Statistiques
  totalWorkouts: number;
  totalDuration: number; // en minutes
  totalCalories: number;
  personalBest?: {
    type: string; // "time", "weight", "reps", etc.
    value: number;
    unit: string;
    achievedAt: Date;
  };
  
  // Social
  isPublic: boolean; // si les stats sont publiques
  invitedBy?: string; // ID de l'utilisateur qui a invité
  teamId?: string; // ID de l'équipe
  notes?: string;
  
  // Récompenses obtenues
  badgesEarned?: string[]; // IDs des badges obtenus
  pointsEarned: number;
}

import { Document } from "mongoose";
import { Timestamps } from "./timestamps";
import { DifficultyLevel } from "./exercise.interface";
import { TypeExercise } from "./typeExercise.interface";

export enum ChallengeStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ChallengeType {
  INDIVIDUAL = "INDIVIDUAL",
  GROUP = "GROUP",
  COMPETITIVE = "COMPETITIVE",
}

export interface ChallengeExercise {
  exerciseId: string;
  sets?: number;
  reps?: number;
  duration?: number; // sec
  restTime?: number; // sec
  weight?: number; // kg
  distance?: number; // m
}

export interface ChallengeGoal {
  type: "TIME" | "REPS" | "WEIGHT" | "DISTANCE" | "CALORIES";
  target: number;
  unit: string;
}

export interface Challenge extends Document, Timestamps {
  _id: string;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: DifficultyLevel;
  status: ChallengeStatus;

  // Détails du défi
  exercises: ChallengeExercise[];
  goals: ChallengeGoal[];
  duration?: number; // durée en jours
  maxParticipants?: number;

  startDate?: Date;
  endDate?: Date;

  // Relations
  createdBy: string;
  gymId?: string;

  // Social
  isPublic: boolean;
  participantCount: number;
  currentParticipants: number;
  likes: number;

  // Récompenses
  rewards?: {
    badgeId?: string;
    points?: number;
    description?: string;
  };

  // Métadonnées
  tags?: string[];
  imageUrl?: string;
  requirements?: string[];
}

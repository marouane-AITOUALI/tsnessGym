import { Document } from "mongoose";
import { Timestamps } from "./timestamps";

export enum GymStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface Gym extends Document, Timestamps {
  _id: string;
  name: string;
  location: string;
  description?: string;
  capacity?: number;
  equipment?: string[];
  difficultyLevels?: string[];
  createdBy: string;
  ownerId: string;
  status: GymStatus;
  approvedByAdmin?: string;
  assignedTypeExercises?: string[];
}

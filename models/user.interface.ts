import { Document } from "mongoose";
import { Timestamps } from "./timestamps";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  GYM_OWNER = "GYM_OWNER",
  USER = "USER",
}

export interface User extends Document, Timestamps {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  badges?: string[];
  totalScore: number;
  gymId?: string;
  friends?: string[];
  challengesCompleted: number;
  totalCaloriesBurned: number;
  streakDays: number;
  lastActivityDate?: Date;
}

import { Document } from "mongoose";
import { Timestamps } from "./timestamps";

export enum BadgeType {
  ACHIEVEMENT = "ACHIEVEMENT",
  STREAK = "STREAK",
  SCORE = "SCORE",
  CHALLENGE = "CHALLENGE",
  SOCIAL = "SOCIAL",
}

export interface BadgeRule {
  type: string;
  condition: string;
  value: number;
  operator: string;
}

export interface Badge extends Document, Timestamps {
  _id: string;
  name: string;
  description: string;
  type: BadgeType;
  rules: BadgeRule[];
  points: number;
  isActive: boolean;
  createdBy: string;
}
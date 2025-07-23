import { Document } from "mongoose";
import { Timestamps } from "./timestamps";

export interface TypeExercise extends Document, Timestamps {
  _id: string;
  name: string;
  description?: string;
  targetedMuscles: string[];
  createdBy: string;
}

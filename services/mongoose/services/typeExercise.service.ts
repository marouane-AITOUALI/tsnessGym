import { Mongoose, Model } from "mongoose";
import { TypeExercise } from "../../../models";
import { typeExerciseSchema } from "../schema";

export interface CreateTypeExercise {
  name: string;
  description?: string;
  targetedMuscles: string[];
  createdBy: string;
}

export class TypeExerciseService {
    readonly typeExercice: Model<TypeExercise>;
  
    constructor(public readonly connection: Mongoose) {
        this.typeExercice = connection.model<TypeExercise>("TypeExercise", typeExerciseSchema());
    }

    async getAllTypeExercises(): Promise<TypeExercise[]> {
        return this.typeExercice
        .find()
        .populate("createdBy", "firstName lastName email")
        .sort({ name: 1 });
    }

    async getTypeExerciseById(id: string): Promise<TypeExercise | null> {
        return this.typeExercice
        .findById(id)
        .populate("createdBy", "firstName lastName email");
    }

    async createTypeExercise(data: CreateTypeExercise): Promise<TypeExercise> {
        return this.typeExercice.create(data);
    }

    async updateTypeExercise(
        id: string,
        updateData: Partial<TypeExercise>
    ): Promise<TypeExercise | null> {
        return this.typeExercice
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate("createdBy", "firstName lastName email");
    }

    async deleteTypeExercise(id: string): Promise<boolean> {
        const result = await this.typeExercice.findByIdAndDelete(id);
        return result !== null;
    }

    async getTypeExercisesByMuscle(muscle: string): Promise<TypeExercise[]> {
        return this.typeExercice
        .find({ targetedMuscles: { $in: [muscle] } })
        .populate("createdBy", "firstName lastName email")
        .sort({ name: 1 });
    }

    async getTypeExercisesByDifficulty(
        difficultyLevel: string
    ): Promise<TypeExercise[]> {
        return this.typeExercice
        .find({ difficultyLevel })
        .populate("createdBy", "firstName lastName email")
        .sort({ name: 1 });
    }
}

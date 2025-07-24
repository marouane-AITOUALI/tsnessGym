import { Mongoose, Model } from "mongoose";
import { Gym, GymStatus } from "../../../models";
import { gymSchema } from "../schema";

export interface CreateGym {
  name: string;
  location: string;
  description?: string;
  capacity?: number;
  equipment?: string[];
  difficultyLevels?: string[];
  createdBy: string; // Qui a créé la demande
  ownerId: string; // Le propriétaire assigné à cette salle
  status: GymStatus;
  approvedByAdmin?: string;
}

export class GymService {
  readonly gymModel: Model<Gym>;

  constructor(public readonly connection: Mongoose) {
    this.gymModel = connection.model<Gym>("Gym", gymSchema());
  }

  async createGym(gym: CreateGym): Promise<Gym> {
    return this.gymModel.create(gym);
  }

  async getGymById(id: string): Promise<Gym | null> {
    return this.gymModel.findById(id);
  }

  async getGymByName(name: string): Promise<Gym[] | null> {
    return this.gymModel.find({ name: new RegExp(name, "i") });
  }

  async getAllGyms(): Promise<Gym[]> {
    return this.gymModel
      .find()
      .populate("ownerId", "firstName lastName email")
      .populate("createdBy", "firstName lastName email");
  }

  async getGymsByOwner(ownerId: string): Promise<Gym[]> {
    return this.gymModel
      .find({ ownerId })
      .populate("createdBy", "firstName lastName email");
  }

  async getGymByOwnerId(ownerId: string): Promise<Gym | null> {
    return this.gymModel
      .findOne({ ownerId })
      .populate("createdBy", "firstName lastName email");
  }

  async getPendingGyms(): Promise<Gym[]> {
    return this.gymModel
      .find({ status: GymStatus.PENDING })
      .populate("ownerId", "firstName lastName email")
      .populate("createdBy", "firstName lastName email");
  }

  async assignGymToOwner(
    gymId: string,
    ownerId: string,
    adminId: string
  ): Promise<Gym | null> {
    return this.gymModel
      .findByIdAndUpdate(
        gymId,
        {
          ownerId: ownerId,
          status: GymStatus.APPROVED,
          approvedByAdmin: adminId,
        },
        { new: true }
      )
      .populate("ownerId", "firstName lastName email");
  }

  async approveGym(gymId: string, adminId: string): Promise<Gym | null> {
    return this.gymModel
      .findByIdAndUpdate(
        gymId,
        {
          status: GymStatus.APPROVED,
          approvedByAdmin: adminId,
        },
        { new: true }
      )
      .populate("ownerId", "firstName lastName email");
  }

  async rejectGym(gymId: string): Promise<Gym | null> {
    return this.gymModel.findByIdAndUpdate(
      gymId,
      { status: GymStatus.REJECTED },
      { new: true }
    );
  }

  async updateGym(
    gymId: string,
    updateData: Partial<Gym>
  ): Promise<Gym | null> {
    return this.gymModel
      .findByIdAndUpdate(gymId, updateData, { new: true })
      .populate("createdBy ownerId", "firstName lastName email");
  }

  async deleteGym(gymId: string): Promise<boolean> {
    const result = await this.gymModel.findByIdAndDelete(gymId);
    return result !== null;
  }

  async assignTypeExercisesToGym(
    gymId: string,
    typeExerciseIds: string[]
  ): Promise<Gym | null> {
    return this.gymModel
      .findByIdAndUpdate(
        gymId,
        { assignedTypeExercises: typeExerciseIds },
        { new: true }
      )
      .populate("assignedTypeExercises", "name description targetedMuscles");
  }

  async addTypeExerciseToGym(
    gymId: string,
    typeExerciseId: string
  ): Promise<Gym | null> {
    return this.gymModel
      .findByIdAndUpdate(
        gymId,
        { $addToSet: { assignedTypeExercises: typeExerciseId } },
        { new: true }
      )
      .populate("assignedTypeExercises", "name description targetedMuscles");
  }

  async removeTypeExerciseFromGym(
    gymId: string,
    typeExerciseId: string
  ): Promise<Gym | null> {
    return this.gymModel
      .findByIdAndUpdate(
        gymId,
        { $pull: { assignedTypeExercises: typeExerciseId } },
        { new: true }
      )
      .populate("assignedTypeExercises", "name description targetedMuscles");
  }

  async getGymsByTypeExercise(typeExerciseId: string): Promise<Gym[]> {
    return this.gymModel
      .find({
        assignedTypeExercises: typeExerciseId,
        status: GymStatus.APPROVED,
      })
      .populate("assignedTypeExercises", "name description targetedMuscles");
  }
}

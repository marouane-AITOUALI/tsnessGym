import { Mongoose, Model } from "mongoose";
import { Challenge, ChallengeStatus, ChallengeType, DifficultyLevel } from "../../../models";
import { challengeSchema } from "../schema";

export interface CreateChallenge {
  title: string;
  description: string;
  createdBy: string;
  gymId?: string;
  exercises: {
    exerciseId: string;
    sets?: number;
    reps?: number;
    duration?: number;
    restTime?: number;
    weight?: number;
    distance?: number;
  }[];
  goals: {
    type: "TIME" | "REPS" | "WEIGHT" | "DISTANCE" | "CALORIES";
    target: number;
    unit: string;
  }[];
  difficulty: DifficultyLevel;
  type?: ChallengeType;
  duration: number;
  maxParticipants?: number;
  rewards?: {
    points: number;
    badgeIds?: string[];
  };
  estimatedCaloriesBurn?: number;
  tags?: string[];
  isPublic?: boolean;
  inviteOnly?: boolean;
  teamBased?: boolean;
}

export class ChallengeService {
  readonly challengeModel: Model<Challenge>;

  constructor(public readonly connection: Mongoose) {
    this.challengeModel = connection.model<Challenge>("Challenge", challengeSchema());
  }

  async createChallenge(challenge: CreateChallenge): Promise<Challenge> {
    return this.challengeModel.create(challenge);
  }

  async getChallengeById(id: string): Promise<Challenge | null> {
    return this.challengeModel
      .findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("gymId", "name location")
      .populate("exercises.exerciseId", "name description targetedMuscles")
      .populate("rewards.badgeIds", "name description points");
  }

  async getAllChallenges(filters?: {
    difficulty?: DifficultyLevel;
    type?: ChallengeType;
    status?: ChallengeStatus;
    gymId?: string;
    isPublic?: boolean;
    createdBy?: string;
  }): Promise<Challenge[]> {
    const query: any = {};
    
    if (filters?.difficulty) query.difficulty = filters.difficulty;
    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;
    if (filters?.gymId) query.gymId = filters.gymId;
    if (filters?.isPublic !== undefined) query.isPublic = filters.isPublic;
    if (filters?.createdBy) query.createdBy = filters.createdBy;

    return this.challengeModel
      .find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("gymId", "name location")
      .sort({ createdAt: -1 });
  }

  async getPublicChallenges(): Promise<Challenge[]> {
    return this.getAllChallenges({ 
      isPublic: true, 
      status: ChallengeStatus.ACTIVE 
    });
  }

  async searchChallenges(searchTerm: string, filters?: {
    difficulty?: DifficultyLevel;
    type?: ChallengeType;
  }): Promise<Challenge[]> {
    const query: any = {
      isPublic: true,
      status: ChallengeStatus.ACTIVE,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ]
    };

    if (filters?.difficulty) query.difficulty = filters.difficulty;
    if (filters?.type) query.type = filters.type;

    return this.challengeModel
      .find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("gymId", "name location")
      .sort({ createdAt: -1 });
  }

  async updateChallenge(challengeId: string, updateData: Partial<Challenge>): Promise<Challenge | null> {
    return this.challengeModel
      .findByIdAndUpdate(challengeId, updateData, { new: true })
      .populate("createdBy", "firstName lastName email")
      .populate("gymId", "name location");
  }

  async activateChallenge(challengeId: string): Promise<Challenge | null> {
    const now = new Date();
    return this.challengeModel.findByIdAndUpdate(
      challengeId, 
      { 
        status: ChallengeStatus.ACTIVE,
        startDate: now,
        endDate: new Date(now.getTime() + (24 * 60 * 60 * 1000)) // +1 jour par défaut
      }, 
      { new: true }
    );
  }

  async deleteChallenge(challengeId: string): Promise<boolean> {
    const result = await this.challengeModel.findByIdAndDelete(challengeId);
    return result !== null;
  }

  async incrementParticipants(challengeId: string): Promise<Challenge | null> {
    return this.challengeModel.findByIdAndUpdate(
      challengeId,
      { $inc: { currentParticipants: 1 } },
      { new: true }
    );
  }

  async decrementParticipants(challengeId: string): Promise<Challenge | null> {
    return this.challengeModel.findByIdAndUpdate(
      challengeId,
      { $inc: { currentParticipants: -1 } },
      { new: true }
    );
  }
}

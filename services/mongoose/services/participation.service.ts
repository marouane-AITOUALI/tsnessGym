import { Mongoose, Model } from "mongoose";
import { ChallengeParticipation, ParticipationStatus, WorkoutSession } from "../../../models";
import { participationSchema } from "../schema";

export interface CreateParticipation {
  userId: string;
  challengeId: string;
  invitedBy?: string;
  teamId?: string;
}

export class ParticipationService {
  readonly participationModel: Model<ChallengeParticipation>;

  constructor(public readonly connection: Mongoose) {
    this.participationModel = connection.model<ChallengeParticipation>("ChallengeParticipation", participationSchema());
  }

  async createParticipation(participation: CreateParticipation): Promise<ChallengeParticipation> {
    return this.participationModel.create(participation);
  }

  async getParticipationById(id: string): Promise<ChallengeParticipation | null> {
    return this.participationModel
      .findById(id)
      .populate("userId", "firstName lastName email")
      .populate("challengeId", "title description difficulty")
      .populate("invitedBy", "firstName lastName email");
  }

  async getUserParticipations(userId: string): Promise<ChallengeParticipation[]> {
    return this.participationModel
      .find({ userId })
      .populate("challengeId", "title description difficulty status")
      .sort({ createdAt: -1 });
  }

  async getChallengeParticipations(challengeId: string): Promise<ChallengeParticipation[]> {
    return this.participationModel
      .find({ challengeId })
      .populate("userId", "firstName lastName email")
      .sort({ progress: -1, createdAt: -1 });
  }

  async getUserChallengeParticipation(userId: string, challengeId: string): Promise<ChallengeParticipation | null> {
    return this.participationModel.findOne({ userId, challengeId });
  }

  async updateProgress(participationId: string, progress: number): Promise<ChallengeParticipation | null> {
    const updateData: any = { progress };
    
    // Si le défi est terminé (100%), marquer comme complété
    if (progress >= 100) {
      updateData.status = ParticipationStatus.COMPLETED;
      updateData.completedAt = new Date();
    } else if (progress > 0) {
      updateData.status = ParticipationStatus.IN_PROGRESS;
    }

    return this.participationModel
      .findByIdAndUpdate(participationId, updateData, { new: true })
      .populate("userId", "firstName lastName email")
      .populate("challengeId", "title description");
  }

  async addWorkoutSession(
    participationId: string, 
    session: WorkoutSession
  ): Promise<ChallengeParticipation | null> {
    return this.participationModel
      .findByIdAndUpdate(
        participationId,
        { 
          $push: { workoutSessions: session },
          $inc: { 
            totalCalories: session.totalCalories,
            totalDuration: session.totalDuration,
            totalWorkouts: 1
          }
        },
        { new: true }
      )
      .populate("userId", "firstName lastName email")
      .populate("challengeId", "title description");
  }

  async updatePersonalBest(
    participationId: string,
    personalBest: {
      weight?: number;
      reps?: number;
      time?: number;
      distance?: number;
    }
  ): Promise<ChallengeParticipation | null> {
    return this.participationModel.findByIdAndUpdate(
      participationId,
      { personalBest },
      { new: true }
    );
  }

  async abandonChallenge(participationId: string): Promise<ChallengeParticipation | null> {
    return this.participationModel.findByIdAndUpdate(
      participationId,
      { status: ParticipationStatus.ABANDONED },
      { new: true }
    );
  }

  async deleteParticipation(participationId: string): Promise<boolean> {
    const result = await this.participationModel.findByIdAndDelete(participationId);
    return result !== null;
  }

  async getLeaderboard(challengeId: string): Promise<ChallengeParticipation[]> {
    return this.participationModel
      .find({ challengeId, status: { $ne: ParticipationStatus.ABANDONED } })
      .populate("userId", "firstName lastName email")
      .sort({ progress: -1, totalCaloriesBurned: -1 })
      .limit(10);
  }

  async getUserStats(userId: string): Promise<{
    totalChallenges: number;
    completedChallenges: number;
    activeChallenges: number;
    totalCaloriesBurned: number;
    averageProgress: number;
  }> {
    const participations = await this.participationModel.find({ userId });
    
    const stats = {
      totalChallenges: participations.length,
      completedChallenges: participations.filter(p => p.status === ParticipationStatus.COMPLETED).length,
      activeChallenges: participations.filter(p => p.status === ParticipationStatus.IN_PROGRESS).length,
      totalCaloriesBurned: participations.reduce((sum, p) => sum + p.totalCalories, 0),
      averageProgress: participations.length > 0 
        ? participations.reduce((sum, p) => sum + p.progress, 0) / participations.length 
        : 0
    };

    return stats;
  }
}

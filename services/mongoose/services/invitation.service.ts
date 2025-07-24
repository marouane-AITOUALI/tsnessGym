import { Mongoose, Model, isValidObjectId } from "mongoose";
import { ChallengeInvitation, InvitationStatus, InvitationType } from "../../../models";
import { invitationSchema } from "../schema";

export interface CreateInvitation {
  challengeId: string;
  fromUserId: string;
  toUserId: string;
  type: InvitationType;
  message?: string;
}

export class InvitationService {
  readonly invitationModel: Model<ChallengeInvitation>;

  constructor(public readonly connection: Mongoose) {
    this.invitationModel = connection.model<ChallengeInvitation>("ChallengeInvitation", invitationSchema());
  }

  async createInvitation(invitation: CreateInvitation): Promise<ChallengeInvitation> {
    return this.invitationModel.create(invitation);
  }

  async getInvitationById(id: string): Promise<ChallengeInvitation | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    return this.invitationModel
      .findById(id)
      .populate("challengeId", "title description difficulty")
      .populate("fromUserId", "firstName lastName email")
      .populate("toUserId", "firstName lastName email")
      .exec();
  }

  async getUserInvitations(userId: string, status?: InvitationStatus): Promise<ChallengeInvitation[]> {
    const query: any = { toUserId: userId };
    if (status) {
      query.status = status;
    }
    
    return this.invitationModel
      .find(query)
      .populate("challengeId", "title description difficulty status")
      .populate("fromUserId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .exec();
  }

  async getSentInvitations(userId: string): Promise<ChallengeInvitation[]> {
    return this.invitationModel
      .find({ fromUserId: userId })
      .populate("challengeId", "title description difficulty")
      .populate("toUserId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateInvitationStatus(
    invitationId: string, 
    status: InvitationStatus
  ): Promise<ChallengeInvitation | null> {
    if (!isValidObjectId(invitationId)) {
      return null;
    }
    return this.invitationModel
      .findByIdAndUpdate(
        invitationId,
        { status },
        { new: true }
      )
      .populate("challengeId", "title description difficulty")
      .populate("fromUserId", "firstName lastName email")
      .exec();
  }

  async getExistingInvitation(
    challengeId: string, 
    fromUserId: string, 
    toUserId: string
  ): Promise<ChallengeInvitation | null> {
    return this.invitationModel.findOne({
      challengeId,
      fromUserId,
      toUserId,
      status: InvitationStatus.PENDING
    });
  }

  async expireOldInvitations(): Promise<void> {
    await this.invitationModel.updateMany(
      {
        status: InvitationStatus.PENDING,
        expiresAt: { $lt: new Date() }
      },
      { status: InvitationStatus.EXPIRED }
    );
  }

  async deleteInvitation(invitationId: string): Promise<boolean> {
    if (!isValidObjectId(invitationId)) {
      return false;
    }
    const result = await this.invitationModel.findByIdAndDelete(invitationId);
    return result !== null;
  }
}

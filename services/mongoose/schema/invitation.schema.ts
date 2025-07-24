import { Schema } from "mongoose";
import { ChallengeInvitation, InvitationStatus, InvitationType } from "../../../models";

export function invitationSchema(): Schema {
  return new Schema(
    {
      challengeId: {
        type: Schema.Types.ObjectId,
        ref: "Challenge",
        required: true,
      },
      fromUserId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      toUserId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      type: {
        type: String,
        enum: Object.values(InvitationType),
        required: true,
      },
      status: {
        type: String,
        enum: Object.values(InvitationStatus),
        default: InvitationStatus.PENDING,
      },
      message: {
        type: String,
        trim: true,
      },
      expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );
}

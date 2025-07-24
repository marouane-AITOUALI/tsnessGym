import { Document } from "mongoose";
import { Timestamps } from "./timestamps";

export enum InvitationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  EXPIRED = "EXPIRED",
}

export enum InvitationType {
  CHALLENGE_INVITE = "CHALLENGE_INVITE",
  FRIEND_CHALLENGE = "FRIEND_CHALLENGE",
}

export interface ChallengeInvitation extends Document, Timestamps {
  _id: string;
  challengeId: string;
  fromUserId: string; // qui envoie l'invitation
  toUserId: string; // qui reçoit l'invitation
  type: InvitationType;
  status: InvitationStatus;
  message?: string;
  expiresAt: Date;
}

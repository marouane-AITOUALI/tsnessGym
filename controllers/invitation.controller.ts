import {
  InvitationService,
  ChallengeService,
  ParticipationService,
  SessionService,
  UserService,
} from "../services/mongoose";
import { Request, Response, Router } from "express";
import {
  sessionMiddleware,
  userMiddleware,
} from "../middlewares";
import { InvitationType, InvitationStatus } from "../models";

export class InvitationController {
  constructor(
    public readonly invitationService: InvitationService,
    public readonly challengeService: ChallengeService,
    public readonly participationService: ParticipationService,
    public readonly sessionService: SessionService,
    public readonly userService: UserService
  ) {}

  // INVITE friends to challenge
  async inviteFriendsToChallenge(req: Request, res: Response) {
    try {
      const { challengeId } = req.params;
      const { friendIds, message } = req.body;

      if (!friendIds || !Array.isArray(friendIds) || friendIds.length === 0) {
        res.status(400).json({ error: "Friend IDs array is required" });
        return;
      }

      // Vérifier que le défi existe
      const challenge = await this.challengeService.getChallengeById(challengeId);
      if (!challenge) {
        res.status(404).json({ error: "Challenge not found" });
        return;
      }

      // Vérifier que l'utilisateur est le créateur du défi ou y participe
      const isCreator = challenge.createdBy.toString() === req.user._id.toString();
      const participation = await this.participationService.getUserChallengeParticipation(
        req.user._id.toString(), 
        challengeId
      );

      if (!isCreator && !participation) {
        res.status(403).json({ 
          error: "You must be the creator or participant to invite friends" 
        });
        return;
      }

      // Vérifier que tous les IDs sont des amis
      const userFriends = await this.userService.getFriends(req.user._id.toString());
      const friendIdsSet = new Set(userFriends.map(f => f._id.toString()));

      const invalidFriends = friendIds.filter(id => !friendIdsSet.has(id));
      if (invalidFriends.length > 0) {
        res.status(400).json({ 
          error: "Some users are not your friends",
          invalidFriends 
        });
        return;
      }

      const invitations = [];
      const errors = [];

      for (const friendId of friendIds) {
        try {
          // Vérifier si une invitation existe déjà
          const existingInvitation = await this.invitationService.getExistingInvitation(
            challengeId,
            req.user._id.toString(),
            friendId
          );

          if (existingInvitation) {
            errors.push({
              friendId,
              error: "Invitation already sent"
            });
            continue;
          }

          // Vérifier si l'ami participe déjà
          const existingParticipation = await this.participationService.getUserChallengeParticipation(
            friendId,
            challengeId
          );

          if (existingParticipation) {
            errors.push({
              friendId,
              error: "User already participating"
            });
            continue;
          }

          const invitation = await this.invitationService.createInvitation({
            challengeId,
            fromUserId: req.user._id.toString(),
            toUserId: friendId,
            type: InvitationType.CHALLENGE_INVITE,
            message,
          });

          invitations.push(invitation);
        } catch (error) {
          errors.push({
            friendId,
            error: "Failed to create invitation"
          });
        }
      }

      res.status(201).json({
        message: "Invitations sent",
        invitations,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Error inviting friends:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // CHALLENGE a specific user
  async challengeUser(req: Request, res: Response) {
    try {
      const { challengeId } = req.params;
      const { userId, message } = req.body;

      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      // Vérifier que le défi existe
      const challenge = await this.challengeService.getChallengeById(challengeId);
      if (!challenge) {
        res.status(404).json({ error: "Challenge not found" });
        return;
      }

      // Vérifier que l'utilisateur cible existe
      const targetUser = await this.userService.findUserById(userId);
      if (!targetUser || !targetUser.isActive) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Vérifier qu'on ne se défie pas soi-même
      if (userId === req.user._id.toString()) {
        res.status(400).json({ error: "Cannot challenge yourself" });
        return;
      }

      // Vérifier si une invitation existe déjà
      const existingInvitation = await this.invitationService.getExistingInvitation(
        challengeId,
        req.user._id.toString(),
        userId
      );

      if (existingInvitation) {
        res.status(400).json({ error: "Challenge already sent to this user" });
        return;
      }

      // Vérifier si l'utilisateur participe déjà
      const existingParticipation = await this.participationService.getUserChallengeParticipation(
        userId,
        challengeId
      );

      if (existingParticipation) {
        res.status(400).json({ error: "User already participating in this challenge" });
        return;
      }

      const invitation = await this.invitationService.createInvitation({
        challengeId,
        fromUserId: req.user._id.toString(),
        toUserId: userId,
        type: InvitationType.FRIEND_CHALLENGE,
        message: message || `${req.user.firstName} ${req.user.lastName} vous défie!`,
      });

      res.status(201).json({
        message: "Challenge sent successfully",
        invitation,
      });
    } catch (error) {
      console.error("Error challenging user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET pending invitations
  async getPendingInvitations(req: Request, res: Response) {
    try {
      // Expirer les anciennes invitations
      await this.invitationService.expireOldInvitations();

      const invitations = await this.invitationService.getUserInvitations(
        req.user._id.toString(),
        InvitationStatus.PENDING
      );

      res.json(invitations);
    } catch (error) {
      console.error("Error getting invitations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // GET all invitations (sent and received)
  async getAllInvitations(req: Request, res: Response) {
    try {
      const received = await this.invitationService.getUserInvitations(req.user._id.toString());
      const sent = await this.invitationService.getSentInvitations(req.user._id.toString());

      res.json({
        received,
        sent,
      });
    } catch (error) {
      console.error("Error getting all invitations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // ACCEPT invitation
  async acceptInvitation(req: Request, res: Response) {
    try {
      const { invitationId } = req.params;

      const invitation = await this.invitationService.getInvitationById(invitationId);
      if (!invitation) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }

      // Vérifier que l'invitation appartient à l'utilisateur
      const toUserIdString = (invitation.toUserId as any)._id ? (invitation.toUserId as any)._id.toString() : invitation.toUserId.toString();
      if (toUserIdString !== req.user._id.toString()) {
        res.status(403).json({ error: "This invitation is not for you" });
        return;
      }

      // Vérifier que l'invitation est en attente
      if (invitation.status !== InvitationStatus.PENDING) {
        res.status(400).json({ error: "Invitation is no longer pending" });
        return;
      }

      // Vérifier que l'invitation n'a pas expiré
      if (invitation.expiresAt < new Date()) {
        await this.invitationService.updateInvitationStatus(
          invitationId,
          InvitationStatus.EXPIRED
        );
        res.status(400).json({ error: "Invitation has expired" });
        return;
      }

      // Vérifier si l'utilisateur participe déjà au défi
      const challengeIdString = (invitation.challengeId as any)._id ? (invitation.challengeId as any)._id.toString() : invitation.challengeId.toString();
      const existingParticipation = await this.participationService.getUserChallengeParticipation(
        req.user._id.toString(),
        challengeIdString
      );

      if (existingParticipation) {
        await this.invitationService.updateInvitationStatus(
          invitationId,
          InvitationStatus.ACCEPTED
        );
        res.status(400).json({ error: "You are already participating in this challenge" });
        return;
      }

      // Accepter l'invitation
      const updatedInvitation = await this.invitationService.updateInvitationStatus(
        invitationId,
        InvitationStatus.ACCEPTED
      );

      // Créer la participation
      const fromUserIdString = (invitation.fromUserId as any)._id ? (invitation.fromUserId as any)._id.toString() : invitation.fromUserId.toString();
      const participation = await this.participationService.createParticipation({
        userId: req.user._id.toString(),
        challengeId: challengeIdString,
        invitedBy: fromUserIdString,
      });

      // Incrémenter le nombre de participants
      await this.challengeService.incrementParticipants(challengeIdString);

      res.json({
        message: "Invitation accepted successfully",
        invitation: updatedInvitation,
        participation,
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // DECLINE invitation
  async declineInvitation(req: Request, res: Response) {
    try {
      const { invitationId } = req.params;

      const invitation = await this.invitationService.getInvitationById(invitationId);
      if (!invitation) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }

      // Vérifier que l'invitation appartient à l'utilisateur
      const toUserIdString = (invitation.toUserId as any)._id ? (invitation.toUserId as any)._id.toString() : invitation.toUserId.toString();
      if (toUserIdString !== req.user._id.toString()) {
        res.status(403).json({ error: "This invitation is not for you" });
        return;
      }

      // Vérifier que l'invitation est en attente
      if (invitation.status !== InvitationStatus.PENDING) {
        res.status(400).json({ error: "Invitation is no longer pending" });
        return;
      }

      const updatedInvitation = await this.invitationService.updateInvitationStatus(
        invitationId,
        InvitationStatus.DECLINED
      );

      res.json({
        message: "Invitation declined",
        invitation: updatedInvitation,
      });
    } catch (error) {
      console.error("Error declining invitation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  buildRouter(): Router {
    const router = Router();

    // Inviter des amis à un défi
    router.post(
      "/challenges/:challengeId/invite",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.inviteFriendsToChallenge.bind(this)
    );

    // Défier un utilisateur spécifique
    router.post(
      "/challenges/:challengeId/challenge",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.challengeUser.bind(this)
    );

    // Récupérer les invitations en attente
    router.get(
      "/invitations/pending",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.getPendingInvitations.bind(this)
    );

    // Récupérer toutes les invitations
    router.get(
      "/invitations",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.getAllInvitations.bind(this)
    );

    // Accepter une invitation
    router.post(
      "/invitations/:invitationId/accept",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.acceptInvitation.bind(this)
    );

    // Refuser une invitation
    router.post(
      "/invitations/:invitationId/decline",
      sessionMiddleware(this.sessionService),
      userMiddleware(),
      this.declineInvitation.bind(this)
    );

    return router;
  }
}

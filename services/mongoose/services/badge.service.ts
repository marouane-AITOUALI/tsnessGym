import { Mongoose, Model } from "mongoose";
import { badgeSchema } from "../schema";
import { Badge, BadgeType, BadgeRule } from "../../../models";

export interface CreateBadge {
  name: string;
  description: string;
  type: BadgeType;
  rules: BadgeRule[];
  points: number;
  createdBy: string;
}

export class BadgeService {
  readonly badgeModel: Model<Badge>;

  constructor(public readonly connection: Mongoose) {
    this.badgeModel = connection.model<Badge>("Badge", badgeSchema());
  }

  async getAllBadges(): Promise<Badge[]> {
    return this.badgeModel
      .find()
      .populate("createdBy", "firstName lastName email")
      .sort({ name: 1 });
  }

  async getActiveBadges(): Promise<Badge[]> {
    return this.badgeModel
      .find({ isActive: true })
      .populate("createdBy", "firstName lastName email")
      .sort({ name: 1 });
  }

  async getBadgeById(id: string): Promise<Badge | null> {
    return this.badgeModel
      .findById(id)
      .populate("createdBy", "firstName lastName email");
  }

  async createBadge(data: CreateBadge): Promise<Badge> {
    return this.badgeModel.create(data);
  }

  async updateBadge(
    id: string,
    updateData: Partial<Badge>
  ): Promise<Badge | null> {
    return this.badgeModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate("createdBy", "firstName lastName email");
  }

  async deleteBadge(id: string): Promise<boolean> {
    const result = await this.badgeModel.findByIdAndDelete(id);
    return result !== null;
  }

  async toggleBadgeStatus(id: string): Promise<Badge | null> {
    const badge = await this.badgeModel.findById(id);
    if (!badge) return null;

    return this.badgeModel
      .findByIdAndUpdate(id, { isActive: !badge.isActive }, { new: true })
      .populate("createdBy", "firstName lastName email");
  }

  async getBadgesByType(type: BadgeType): Promise<Badge[]> {
    return this.badgeModel
      .find({ type, isActive: true })
      .populate("createdBy", "firstName lastName email")
      .sort({ name: 1 });
  }

  async checkUserEligibility(userId: string, userStats: any): Promise<Badge[]> {
    const badges = await this.getActiveBadges();
    const eligibleBadges: Badge[] = [];

    for (const badge of badges) {
      let isEligible = true;

      for (const rule of badge.rules) {
        const userValue = userStats[rule.condition];
        if (userValue === undefined) {
          isEligible = false;
          break;
        }

        switch (rule.operator) {
          case ">=":
            if (!(userValue >= rule.value)) isEligible = false;
            break;
          case "<=":
            if (!(userValue <= rule.value)) isEligible = false;
            break;
          case "==":
            if (!(userValue == rule.value)) isEligible = false;
            break;
          case ">":
            if (!(userValue > rule.value)) isEligible = false;
            break;
          case "<":
            if (!(userValue < rule.value)) isEligible = false;
            break;
          default:
            isEligible = false;
        }

        if (!isEligible) break;
      }

      if (isEligible) {
        eligibleBadges.push(badge);
      }
    }

    return eligibleBadges;
  }
}

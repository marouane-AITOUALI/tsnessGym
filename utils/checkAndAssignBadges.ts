import { BadgeService, UserService } from "../services/mongoose";
import { BadgeRule, User } from "../models";

export async function checkAndAssignBadges(
  userId: string,
  badgeService: BadgeService,
  userService: UserService
): Promise<void> {
  try {
    // Récupérer tous les badges
    const badges = await badgeService.getAllBadges();
    
    // Récupérer l'utilisateur
    const user = await userService.findUserById(userId);

    if (!user) {
      console.warn(`Utilisateur avec l'ID ${userId} introuvable.`);
      return;
    }

    for (const badge of badges) {
      if (!badge.rules || badge.rules.length === 0) {
        console.warn(`Badge "${badge.name}" n'a pas de règles définies.`);
        continue;
      }

      // Vérifie que toutes les règles sont respectées (AND logique)
      const allRulesRespected = badge.rules.every((rule: BadgeRule) => {
        const fieldValue = (user as any)[rule.condition];

        switch (rule.operator) {
          case '>': return fieldValue > rule.value;
          case '>=': return fieldValue >= rule.value;
          case '<': return fieldValue < rule.value;
          case '<=': return fieldValue <= rule.value;
          case '==': return fieldValue == rule.value;
          case '!=': return fieldValue != rule.value;
          default:
            console.warn(`Opérateur inconnu : ${rule.operator}`);
            return false;
        }
      });

      if (allRulesRespected) {
        // Vérifier si l'utilisateur n'a pas déjà ce badge
        if (!user.badges?.includes(badge._id)) {
          // Ajouter le badge à l'utilisateur
          await userService.addBadgeToUser(userId, badge._id);
          console.log(`Badge "${badge.name}" attribué à l'utilisateur ${user.firstName} ${user.lastName}`);
          
          // Mettre à jour le score total de l'utilisateur
          await userService.updateUserScore(userId, badge.points || 0);
        }
      }
    }
  } catch (error) {
    console.error('Erreur dans checkAndAssignBadges:', error);
  }
}

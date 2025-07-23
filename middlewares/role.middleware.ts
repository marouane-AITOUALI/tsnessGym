import { NextFunction, Request, Response } from "express";
import { UserRole } from "../models";

export function roleMiddleware(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log("=== ROLE MIDDLEWARE ===");
    console.log("User:", req.user?.email, "Role:", req.user?.role);
    console.log("Allowed roles:", allowedRoles);

    if (!req.user) {
      console.log("No user found");
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log("Insufficient permissions");
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    console.log("Role check passed");
    next();
  };
}

export function superAdminMiddleware() {
  return roleMiddleware(UserRole.SUPER_ADMIN);
}

export function gymOwnerMiddleware() {
  return roleMiddleware(UserRole.SUPER_ADMIN, UserRole.GYM_OWNER);
}

export function AdminOrGymOwnerMiddleware() {
  return roleMiddleware(UserRole.SUPER_ADMIN, UserRole.GYM_OWNER);
}

export function userMiddleware() {
  return roleMiddleware(
    UserRole.SUPER_ADMIN,
    UserRole.GYM_OWNER,
    UserRole.USER
  );
}

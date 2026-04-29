import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_KEY, RULES_KEY, BranchAccessRule, Roles } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    // Admin has full access
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check if user has required role
    return requiredRoles.includes(user.role);
  }
}

@Injectable()
export class BranchAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRule = this.reflector.getAllAndOverride<BranchAccessRule>(RULES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRule) {
      return true;
    }

    const { user, params, query } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    // Admin has full access
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Get branch ID from request (params, query, or body)
    const requestedBranchId = params?.branchId || query?.branchId || (user as any)?.branchId;

    switch (requiredRule) {
      case BranchAccessRule.ALL_BRANCHES:
        return user.role === UserRole.ADMIN;
      
      case BranchAccessRule.OWN_BRANCH:
        return user.role === UserRole.ADMIN || 
               user.branchId === requestedBranchId;
      
      case BranchAccessRule.VIEW_ONLY:
        return true; // All roles can view
      
      default:
        return true;
    }
  }
}
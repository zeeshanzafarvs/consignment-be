import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLE_KEY = 'roles';
export const RULES_KEY = 'rules';

export enum BranchAccessRule {
  ALL_BRANCHES = 'ALL_BRANCHES',
  OWN_BRANCH = 'OWN_BRANCH',
  VIEW_ONLY = 'VIEW_ONLY',
}

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLE_KEY, roles);
export const BranchAccess = (rule: BranchAccessRule) => SetMetadata(RULES_KEY, rule);
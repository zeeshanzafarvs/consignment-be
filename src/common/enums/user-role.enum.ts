export enum UserRole {
  ADMIN = 'ADMIN',
  SITE_OFFICER = 'SITE_OFFICER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
}

export const UserRoleDisplay = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.SITE_OFFICER]: 'Site Officer',
  [UserRole.BRANCH_MANAGER]: 'Branch Manager',
};
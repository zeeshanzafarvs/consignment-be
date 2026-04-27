export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SITE_OFFICER = 'SITE_OFFICER',
}

export const UserRoleDisplay = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.SITE_OFFICER]: 'Site Officer',
};
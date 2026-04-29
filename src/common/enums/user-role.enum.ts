export enum UserRole {
  ADMIN = 'ADMIN',
  SITE_OFFICER = 'SITE_OFFICER',
}

export const UserRoleDisplay = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.SITE_OFFICER]: 'Site Officer',
};
import { UserAccessGroup } from "./user-access-group";

export interface User {
  accessGroup: UserAccessGroup,
  balance: number,
  competitiveRating: number,
  createdAt: string,
  deletedAt: string|null,
  displayName: string,
  email: string,
  experience: number,
  facebookId: number|null,
  firstName: string,
  googleId: string,
  id: number,
  isAdmin: boolean,
  isGuest: boolean,
  isSuspended: boolean,
  lastLoggedTimeMs: number,
  lastName: string,
  nickname: string,
  recentActivityTimeMs: number,
  registerTimeMs: number,
  updatedAt: string
}
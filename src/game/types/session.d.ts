import { GameInstance } from "./game-instance";
import { User } from "./user";

export interface Session {
  createdAt: string,
  deletedAt: string|null,
  id: number,
  instanceId: number,
  nickname: string,
  sessionToken: string,
  updatedAt: string,
  userId: number,
  GameInstance: GameInstance,
  User: User
}
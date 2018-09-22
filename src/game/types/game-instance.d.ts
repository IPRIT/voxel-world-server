export interface GameInstance {
  createdAt: string,
  deletedAt: string|null,
  gameType: string,
  id: number,
  isFinished: boolean,
  serverId: number,
  updatedAt: string
}
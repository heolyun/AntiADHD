export function shouldServerVersionWin(serverUpdatedAt: string, queuedAt: string) {
  return new Date(serverUpdatedAt).getTime() > new Date(queuedAt).getTime();
}

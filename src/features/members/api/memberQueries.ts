export const memberQueryKeys = {
  all: ['members'] as const,
  list: (workspaceId: number) => ['members', workspaceId] as const,
}

const normalizeId = (value: string) => value.replace(/-/g, "").toLowerCase()

export function buildPrivateChatId(firstUserId: string, secondUserId: string): string {
  const first = normalizeId(firstUserId)
  const second = normalizeId(secondUserId)

  return first <= second ? `${first}${second}` : `${second}${first}`
}

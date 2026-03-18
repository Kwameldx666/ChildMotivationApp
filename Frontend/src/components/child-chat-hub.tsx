"use client"

import { useMemo, useState } from "react"
import { MessageCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/provider"
import { useAppSelector } from "@/store/hooks"
import { selectAuthSession } from "@/features/auth/store/authSlice"
import { useFamilyMembers } from "@/services/family-queries"
import FamilyChat from "@/components/family-chat"
import ChildAiChat from "@/components/child-ai-chat"
import { buildPrivateChatId } from "@/lib/private-chat-id"

export default function ChildChatHub() {
  const { t } = useTranslation()
  const session = useAppSelector(selectAuthSession)
  const [mode, setMode] = useState<"messages" | "ai">("messages")

  const { data: familyMembers = [] } = useFamilyMembers({ enabled: Boolean(session) })

  const parents = useMemo(
    () => familyMembers.filter(member => member.role?.toLowerCase() === "parent"),
    [familyMembers]
  )

  const primaryParent = parents[0]

  if (!session) return null

  const privateChatId = primaryParent
    ? buildPrivateChatId(primaryParent.id, session.user.id)
    : session.user.id

  return (
    <div className="space-y-4" data-tour="child-chat">
      <div className="flex items-center gap-2 rounded-xl border p-1 w-fit bg-muted/20">
        <Button
          size="sm"
          variant={mode === "messages" ? "default" : "ghost"}
          className="gap-1.5"
          onClick={() => setMode("messages")}
        >
          <MessageCircle className="h-4 w-4" />
          {t("childChatHub.privateChat")}
        </Button>
        <Button
          size="sm"
          variant={mode === "ai" ? "default" : "ghost"}
          className="gap-1.5"
          onClick={() => setMode("ai")}
        >
          <Sparkles className="h-4 w-4" />
          {t("childChatHub.aiChat")}
        </Button>
      </div>

      {mode === "messages" ? (
        primaryParent ? (
          <div className="h-[calc(100vh-360px)] min-h-[500px]">
            <FamilyChat
              familyId={privateChatId}
              currentUserId={session.user.id}
              currentUserName={session.profile.name}
              currentUserAvatar={session.profile.avatar}
              userRole="child"
              fullScreen={false}
              chatTitle={t("childChatHub.chatWithParent", { name: primaryParent.name })}
              participants={[
                {
                  id: primaryParent.id,
                  name: primaryParent.name,
                  avatar: primaryParent.avatar,
                  role: primaryParent.role,
                },
                {
                  id: session.user.id,
                  name: session.profile.name,
                  avatar: session.profile.avatar,
                  role: "child",
                },
              ]}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            {t("childChatHub.noParent")}
          </div>
        )
      ) : (
        <ChildAiChat />
      )}
    </div>
  )
}

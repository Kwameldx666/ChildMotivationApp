"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageCircle, Users, User } from "lucide-react"
import { useFamilyMembers } from "@/services/family-queries"
import FamilyChat from "./family-chat"
import { cn } from "@/lib/utils"

interface ParentChatSelectorProps {
  familyId: string
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
}

type ChatType = "list" | "group" | "private"

interface SelectedChat {
  type: ChatType
  childId?: string
  childName?: string
}

const FALLBACK_AVATARS = ["👦", "👧", "🧒", "🦄"]

export default function ParentChatSelector({
  familyId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}: ParentChatSelectorProps) {
  const [selectedChat, setSelectedChat] = useState<SelectedChat>({ type: "list" })
  const { data: familyMembers = [] } = useFamilyMembers({ enabled: Boolean(familyId) })

  const children = useMemo(() => {
    return familyMembers.filter((member) => member.role?.toLowerCase() === "child")
  }, [familyMembers])

  const getChildAvatar = (child: any, index: number) => {
    const value = child.avatar?.trim()
    if (value) {
      try {
        const url = new URL(value)
        if (url.protocol === "http:" || url.protocol === "https:") return value
      } catch {}
      return value
    }
    return FALLBACK_AVATARS[index % FALLBACK_AVATARS.length]
  }

  if (selectedChat.type === "group") {
    return (
      <FamilyChat
        familyId={familyId}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        userRole="parent"
        onBack={() => setSelectedChat({ type: "list" })}
      />
    )
  }

  if (selectedChat.type === "private" && selectedChat.childId) {
    // Приватный чат использует уникальный chatId на основе familyId и childId
    const privateChatId = `${familyId}_${selectedChat.childId}`
    
    return (
      <FamilyChat
        familyId={privateChatId}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        userRole="parent"
        onBack={() => setSelectedChat({ type: "list" })}
      />
    )
  }

  // Список чатов
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold">Чаты с детьми</h2>
        <p className="text-sm text-muted-foreground">
          Выберите общий чат или персональную беседу с ребёнком
        </p>
      </div>

      {/* Общий групповой чат */}
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-violet-300 dark:hover:border-violet-700 border-2"
        onClick={() => setSelectedChat({ type: "group" })}
      >
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-2xl">
                  <Users className="w-8 h-8 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 border-2 border-background">
                <MessageCircle className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Общий чат семьи</h3>
              <p className="text-sm text-muted-foreground">
                Общайтесь со всеми детьми одновременно
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  {children.length} {children.length === 1 ? "ребёнок" : "детей"}
                </Badge>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Список детей для приватных чатов */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground px-2">
          Приватные чаты
        </h3>
        
        {children.length === 0 ? (
          <Card>
            <div className="p-8 text-center space-y-2">
              <User className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                Пока нет детей в семье
              </p>
              <p className="text-xs text-muted-foreground">
                Пригласите детей используя код семьи
              </p>
            </div>
          </Card>
        ) : (
          children.map((child, index) => {
            const avatar = getChildAvatar(child, index)
            const isEmoji = avatar && avatar.length <= 2
            
            return (
              <Card
                key={child.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700 border-2"
                onClick={() =>
                  setSelectedChat({
                    type: "private",
                    childId: child.id,
                    childName: child.name,
                  })
                }
              >
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14 border-2 border-background shadow-md">
                        {isEmoji ? (
                          <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950 dark:to-cyan-950">
                            {avatar}
                          </AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src={avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500">
                              {child.name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full w-4 h-4 border-2 border-background" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-base font-semibold">{child.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {child.age ? `${child.age} лет` : "Персональный чат"}
                      </p>
                    </div>

                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

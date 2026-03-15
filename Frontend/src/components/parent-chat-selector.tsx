"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageCircle, Users, UserPlus, Plus } from "lucide-react"
import { useFamilyMembers } from "@/services/family-queries"
import FamilyChat from "./family-chat"
import { useTranslation } from "@/i18n/provider"
import { useRouter } from "next/navigation"

interface ParentChatSelectorProps {
  familyId: string
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
}

type ChatType = "list" | "group" | "private"

interface CustomGroup {
  id: string
  name: string
  memberIds: string[]
}

interface SelectedChat {
  type: ChatType
  childId?: string
  childName?: string
  groupId?: string
}

const FALLBACK_AVATARS = ["👦", "👧", "🧒", "🦄"]

export default function ParentChatSelector({
  familyId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}: ParentChatSelectorProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [selectedChat, setSelectedChat] = useState<SelectedChat>({ type: "list" })
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([])
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([])
  const { data: familyMembers = [] } = useFamilyMembers({ enabled: Boolean(familyId) })

  const storageKey = `familyquest:chat-groups:${familyId}`

  const children = useMemo(() => {
    return familyMembers.filter((member) => member.role?.toLowerCase() === "child")
  }, [familyMembers])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        setCustomGroups([])
        return
      }
      const parsed = JSON.parse(raw) as CustomGroup[]
      setCustomGroups(Array.isArray(parsed) ? parsed : [])
    } catch {
      setCustomGroups([])
    }
  }, [storageKey])

  const persistGroups = (groups: CustomGroup[]) => {
    setCustomGroups(groups)
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(groups))
    } catch {
      // ignore storage errors in demo mode
    }
  }

  const resetGroupDialog = () => {
    setNewGroupName("")
    setNewGroupMembers([])
    setShowGroupDialog(false)
  }

  const toggleGroupMember = (memberId: string) => {
    setNewGroupMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    )
  }

  const createGroup = () => {
    const trimmedName = newGroupName.trim()
    if (!trimmedName || newGroupMembers.length < 2) return

    const group: CustomGroup = {
      id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `group-${Date.now()}`,
      name: trimmedName,
      memberIds: newGroupMembers,
    }

    persistGroups([group, ...customGroups])
    resetGroupDialog()
  }

  const selectedCustomGroup = useMemo(
    () => customGroups.find((group) => group.id === selectedChat.groupId),
    [customGroups, selectedChat.groupId]
  )

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

  if (selectedChat.type === "group" && !selectedChat.groupId) {
    return (
      <FamilyChat
        familyId={familyId}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        userRole="parent"
        onBack={() => setSelectedChat({ type: "list" })}
        chatTitle={t("parentChatSelector.groupChatTitle")}
        participants={familyMembers.map(member => ({
          id: member.id,
          name: member.name,
          avatar: member.avatar,
          role: member.role,
        }))}
      />
    )
  }

  if (selectedChat.type === "group" && selectedCustomGroup) {
    const scopedMembers = familyMembers.filter(member => selectedCustomGroup.memberIds.includes(member.id))

    return (
      <FamilyChat
        familyId={`group:${familyId}:${selectedCustomGroup.id}`}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        userRole="parent"
        onBack={() => setSelectedChat({ type: "list" })}
        chatTitle={selectedCustomGroup.name}
        participants={scopedMembers.map(member => ({
          id: member.id,
          name: member.name,
          avatar: member.avatar,
          role: member.role,
        }))}
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
        chatTitle={selectedChat.childName ?? t("parentChatSelector.personalChat")}
        participants={children
          .filter(child => child.id === selectedChat.childId)
          .map(child => ({
            id: child.id,
            name: child.name,
            avatar: child.avatar,
            role: child.role,
          }))}
      />
    )
  }

  // Список чатов
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold">{t("parentChatSelector.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("parentChatSelector.subtitle")}
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
              <h3 className="text-lg font-semibold mb-1">{t("parentChatSelector.groupChatTitle")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("parentChatSelector.groupChatDescription")}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  {t("parentChatSelector.childrenCount", { count: children.length })}
                </Badge>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Кастомные группы */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {t("parentChatSelector.customGroups")}
          </h3>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowGroupDialog(true)}>
            <Plus className="w-3.5 h-3.5" />
            {t("parentChatSelector.createGroup")}
          </Button>
        </div>

        {customGroups.length === 0 ? (
          <Card>
            <div className="p-4 text-sm text-muted-foreground">
              {t("parentChatSelector.noCustomGroups")}
            </div>
          </Card>
        ) : (
          customGroups.map((group) => {
            const groupMembers = children.filter(child => group.memberIds.includes(child.id))
            return (
              <Card
                key={group.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-violet-300 dark:hover:border-violet-700 border-2"
                onClick={() => setSelectedChat({ type: "group", groupId: group.id })}
              >
                <div className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">{group.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t("parentChatSelector.childrenCount", { count: groupMembers.length })}
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    {groupMembers.slice(0, 3).map((member, index) => {
                      const avatar = getChildAvatar(member, index)
                      const isEmoji = avatar && avatar.length <= 2
                      return (
                        <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                          {isEmoji ? (
                            <AvatarFallback className="text-sm">{avatar}</AvatarFallback>
                          ) : (
                            <>
                              <AvatarImage src={avatar} />
                              <AvatarFallback>{member.name[0]?.toUpperCase()}</AvatarFallback>
                            </>
                          )}
                        </Avatar>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Список детей для приватных чатов */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground px-2">
          {t("parentChatSelector.privateChats")}
        </h3>
        
        {children.length === 0 ? (
          <Card>
            <div className="p-8 text-center space-y-3">
              <UserPlus className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm font-medium text-muted-foreground">
                {t("parentChatSelector.noChildrenTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("parentChatSelector.noChildrenHint")}
              </p>
              <Button
                className="gap-2 mt-2"
                onClick={() => router.push("/dashboard/children")}
              >
                <UserPlus className="w-4 h-4" />
                {t("parentChatSelector.addChildButton")}
              </Button>
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
                        {child.age ? t("parentChatSelector.yearsOld", { age: child.age }) : t("parentChatSelector.personalChat")}
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

      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("parentChatSelector.createGroup")}</DialogTitle>
            <DialogDescription>{t("parentChatSelector.createGroupHint")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("parentChatSelector.groupName")}</Label>
              <Input
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
                placeholder={t("parentChatSelector.groupNamePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("parentChatSelector.pickChildren")}</Label>
              <div className="space-y-2 max-h-56 overflow-y-auto rounded-md border p-2">
                {children.map((child) => (
                  <label key={child.id} className="flex items-center gap-2 rounded-md p-2 hover:bg-muted/40 cursor-pointer">
                    <Checkbox
                      checked={newGroupMembers.includes(child.id)}
                      onCheckedChange={() => toggleGroupMember(child.id)}
                    />
                    <span className="text-sm">{child.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={resetGroupDialog}>{t("common.cancel")}</Button>
            <Button
              onClick={createGroup}
              disabled={!newGroupName.trim() || newGroupMembers.length < 2}
            >
              {t("parentChatSelector.createGroup")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

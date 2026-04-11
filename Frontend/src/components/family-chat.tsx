"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Send, ArrowLeft, Hash, Circle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useFamilyMessages, useSendFamilyMessage } from "@/services/family-chat-queries"
import { useTasks } from "@/services/tasks-queries"
import type { FamilyMessageDto } from "@/services/family-chat-service"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/i18n/provider"
import { mapApiError } from "@/features/auth/utils/mapApiError"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface FamilyChatProps {
  familyId: string
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
  userRole: "parent" | "child"
  onBack?: () => void
  fullScreen?: boolean
  chatTitle?: string
  participants?: Array<{
    id: string
    name: string
    avatar?: string | null
    role?: string
  }>
}

const normalizeDisplayName = (value: string | null | undefined, fallback = 'User') => {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : fallback
}

const displayInitial = (value: string | null | undefined, fallback = 'U') => {
  const name = normalizeDisplayName(value, fallback)
  return name.charAt(0).toUpperCase()
}

export default function FamilyChat({
  familyId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  userRole,
  onBack,
  fullScreen = true,
  chatTitle,
  participants = [],
}: FamilyChatProps) {
  const { t } = useTranslation()
  const [message, setMessage] = useState("")
  const [mentionedTaskId, setMentionedTaskId] = useState<string | null>(null)
  const [showTaskPicker, setShowTaskPicker] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const { data: messages = [], isLoading, isFetching, isError } = useFamilyMessages(familyId)
  const { data: tasks = [] } = useTasks()
  const sendMessage = useSendFamilyMessage(familyId, {
    senderId: currentUserId,
    senderName: currentUserName,
    senderAvatar: currentUserAvatar,
  })

  const mentionedTask = useMemo(() => {
    if (!mentionedTaskId) return null
    return tasks.find(tk => tk.id === mentionedTaskId)
  }, [mentionedTaskId, tasks])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    const trimmed = message.trim()
    if (!trimmed) return

    try {
      await sendMessage.mutateAsync({
        content: trimmed,
        mentionedTaskId: mentionedTaskId,
      })
      setMessage("")
      setMentionedTaskId(null)
      toast({
        title: t("familyChat.messageSent"),
        variant: "default",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: t("familyChat.sendError"),
        description: mapApiError(error, t("familyChat.tryAgain")),
        variant: "destructive",
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return t("familyChat.today")
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t("familyChat.yesterday")
    } else {
      return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
    }
  }

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: FamilyMessageDto[] }[] = []
    
    messages.forEach(msg => {
      const dateKey = new Date(msg.createdAt).toDateString()
      let group = groups.find(g => g.date === dateKey)
      
      if (!group) {
        group = { date: dateKey, messages: [] }
        groups.push(group)
      }
      
      group.messages.push(msg)
    })
    
    return groups
  }, [messages])

  const chatParticipants = useMemo(() => {
    const participantMap = new Map<string, { id: string; name: string; avatar?: string; isOnline: boolean; role?: string }>()
    const lastActivityByUser = new Map<string, number>()
    const now = Date.now()
    const onlineWindowMs = 5 * 60 * 1000

    messages.forEach((msg) => {
      const createdAt = new Date(msg.createdAt).getTime()
      if (Number.isNaN(createdAt)) return
      const previous = lastActivityByUser.get(msg.senderId)
      if (!previous || createdAt > previous) {
        lastActivityByUser.set(msg.senderId, createdAt)
      }
    })

    const isUserOnline = (userId: string) => {
      if (userId === currentUserId) return true
      const lastActivity = lastActivityByUser.get(userId)
      if (!lastActivity) return false
      return now - lastActivity <= onlineWindowMs
    }

    participantMap.set(currentUserId, {
      id: currentUserId,
      name: currentUserName,
      avatar: currentUserAvatar,
      isOnline: true,
      role: userRole,
    })

    participants.forEach((participant) => {
      participantMap.set(participant.id, {
        id: participant.id,
        name: participant.name,
        avatar: participant.avatar ?? undefined,
        isOnline: isUserOnline(participant.id),
        role: participant.role,
      })
    })

    messages.forEach((msg) => {
      const existing = participantMap.get(msg.senderId)
      if (existing) {
        participantMap.set(msg.senderId, {
          ...existing,
          isOnline: isUserOnline(msg.senderId),
        })
        return
      }

      participantMap.set(msg.senderId, {
        id: msg.senderId,
        name: msg.senderName,
        avatar: msg.senderAvatar,
        isOnline: isUserOnline(msg.senderId),
      })
    })

    return Array.from(participantMap.values())
  }, [messages, currentUserId, currentUserName, currentUserAvatar, participants, userRole])

  // Показываем полноэкранную загрузку только при первой загрузке
  if (isLoading && !messages.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400"></div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950",
      fullScreen ? "h-screen" : "h-full min-h-[520px] rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm"
    )}>
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-400/10 dark:bg-rose-500/5 rounded-full blur-3xl pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      {/* Header */}
      <div className="relative z-10 border-b border-white/20 dark:border-slate-800/40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-4 py-3 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.1)] transition-all">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <h1 className="text-[15px] font-bold tracking-tight text-slate-800 dark:text-slate-100 truncate">
                {chatTitle ?? t("chat.familyChat")}
              </h1>
              <Popover open={showParticipants} onOpenChange={setShowParticipants}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2.5 gap-1.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 text-slate-600 dark:text-slate-300 transition-colors">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">{chatParticipants.length}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-2.5 rounded-2xl shadow-xl border-slate-200/50 dark:border-slate-800/50 backdrop-blur-lg bg-white/95 dark:bg-slate-900/95">
                  <div className="space-y-1.5">
                    <p className="px-2 py-1 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                      {t("familyChat.participantsTitle", { count: String(chatParticipants.length) })}
                    </p>
                    {chatParticipants.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
                        {(() => {
                          const participantName = normalizeDisplayName(participant.name)
                          return (
                            <>
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={participant.avatar} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-rose-400 to-pink-400 text-white">
                              {displayInitial(participantName)}
                            </AvatarFallback>
                          </Avatar>
                          {participant.isOnline && (
                            <Circle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 fill-emerald-500 text-emerald-500 stroke-white dark:stroke-slate-900" strokeWidth={2} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{participantName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {participant.isOnline ? t("familyChat.online") : t("familyChat.offline")}
                          </p>
                        </div>
                            </>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {/* Список участников */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {chatParticipants.filter(p => p.id !== currentUserId).map((participant) => (
                <div key={participant.id} className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/40 rounded-full pr-3 pl-1 py-1 border border-slate-200/50 dark:border-slate-700/50">
                  {(() => {
                    const participantName = normalizeDisplayName(participant.name)
                    return (
                      <>
                        <div className="relative shrink-0">
                          <Avatar className="h-6 w-6 border border-white dark:border-slate-800 shadow-sm">
                            <AvatarImage src={participant.avatar} />
                            <AvatarFallback className="text-[10px] bg-gradient-to-br from-rose-400 to-pink-500 text-white font-medium">
                              {displayInitial(participantName)}
                            </AvatarFallback>
                          </Avatar>
                          {participant.isOnline && (
                            <Circle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 fill-emerald-500 text-emerald-500 stroke-white dark:stroke-slate-900" strokeWidth={2} />
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none">
                            {participantName}
                          </span>
                          <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                            {participant.isOnline ? t("familyChat.online") : t("familyChat.offline")}
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              ))}
              {chatParticipants.filter(p => p.id !== currentUserId).length === 0 && (
                <span className="text-xs text-muted-foreground/70 italic px-2">{t("familyChat.noParticipants")}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative z-10">
        {groupedMessages.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-4">
            {/* Date Separator */}
            <div className="flex items-center justify-center sticky top-2 z-10">
              <Badge variant="secondary" className="rounded-full px-4 py-1 text-[11px] font-medium shadow-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50">
                {formatDate(group.date)}
              </Badge>
            </div>

            {/* Messages */}
            {group.messages.map((msg) => {
              const isOwnMessage = msg.senderId === currentUserId
              const mentionedTaskInMsg = msg.mentionedTaskId 
                ? tasks.find(tk => tk.id === msg.mentionedTaskId)
                : null
              const senderInfo = chatParticipants.find(p => p.id === msg.senderId)

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 items-end group",
                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {!isOwnMessage && (
                    <div className="relative flex-shrink-0 mb-4">
                      <Avatar className="h-9 w-9 shadow-sm border border-white dark:border-slate-800">
                        <AvatarImage src={msg.senderAvatar} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-rose-400 to-pink-400 text-white font-semibold">
                          {displayInitial(msg.senderName)}
                        </AvatarFallback>
                      </Avatar>
                      {senderInfo?.isOnline && (
                        <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-emerald-500 text-emerald-500 stroke-white dark:stroke-slate-900" strokeWidth={2} />
                      )}
                    </div>
                  )}

                  <div className={cn(
                    "flex flex-col max-w-[80%] sm:max-w-[70%]",
                    isOwnMessage ? "items-end" : "items-start"
                  )}>
                    {!isOwnMessage && (
                      <span className="text-[11px] font-semibold text-rose-600/80 dark:text-rose-400/80 px-2 mb-1">
                        {normalizeDisplayName(msg.senderName)}
                      </span>
                    )}

                    <div className={cn(
                      "px-4 py-3 shadow-md relative transition-all duration-300 group-hover:shadow-lg",
                      isOwnMessage
                        ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-3xl rounded-br-sm shadow-rose-500/20"
                        : "bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-3xl rounded-bl-sm"
                    )}>
                      {mentionedTaskInMsg && (
                        <div className={cn(
                          "mb-2.5 rounded-2xl border p-3 text-xs shadow-sm cursor-pointer transition-all hover:scale-[1.02]",
                          isOwnMessage
                            ? "border-white/20 bg-white/10 hover:bg-white/20"
                            : "border-rose-100/50 dark:border-slate-700/50 bg-rose-50/30 dark:bg-slate-800/50 hover:border-rose-200 dark:hover:border-slate-600"
                        )}>
                          <div className="flex items-center gap-1.5 opacity-90 mb-1">
                            <Hash className="h-3.5 w-3.5" />
                            <span className="font-bold text-[10px] uppercase tracking-widest">{t("familyChat.attachedTask")}</span>
                          </div>
                          <span className="font-semibold text-sm line-clamp-2 leading-snug">{mentionedTaskInMsg.title}</span>
                        </div>
                      )}

                      <div className="flex items-end gap-3 flex-wrap justify-between">
                        <p className="text-[15px] whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                        <span className={cn(
                          "text-[10px] font-medium shrink-0 ml-auto translate-y-1 block -mb-1",
                          isOwnMessage ? "text-rose-100/80" : "text-slate-400 dark:text-slate-500"
                        )}>
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isOwnMessage && (
                    <div className="h-4 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        ))}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="relative z-10 p-3 sm:px-6 sm:pb-6 pt-2">
        <div className="mx-auto max-w-4xl">
          {mentionedTask && (
            <div className="mb-3 px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-400 to-pink-500" />
              <div className="flex items-start justify-between gap-3 pl-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1.5">
                    <Hash className="h-3.5 w-3.5" />
                    <span>{t("familyChat.attachedTask")}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{mentionedTask.title}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-slate-100/50 dark:bg-slate-800/50 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-900/50 transition-colors"
                  onClick={() => setMentionedTaskId(null)}
                >
                  <Hash className="h-4.5 w-4.5 rotate-45" />
                </Button>
              </div>
            </div>
          )}

          <div className="relative flex items-end gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] p-2 border border-slate-200/60 dark:border-slate-700/60 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] transition-all duration-300 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-rose-300/60 dark:focus-within:border-rose-700/50 focus-within:shadow-[0_8px_30px_-12px_rgba(244,63,94,0.2)]">
            <Popover open={showTaskPicker} onOpenChange={setShowTaskPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "flex-shrink-0 h-10 w-10 ml-1 rounded-full transition-all duration-300",
                    mentionedTask 
                      ? "text-rose-600 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-400 shadow-sm"
                      : "text-slate-400 hover:text-rose-500 hover:bg-rose-50/80 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                  )}
                >
                  <Hash className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl border-slate-200/60 dark:border-slate-800/60 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 overflow-hidden" align="start" sideOffset={16}>
                <Command>
                  <CommandInput placeholder={t("familyChat.searchTask")} className="border-none focus:ring-0 text-[15px] h-12" />
                  <CommandList className="max-h-[280px] p-2">
                    <CommandEmpty className="py-6 text-center text-sm text-slate-500">{t("familyChat.noTasksFound")}</CommandEmpty>
                    <CommandGroup heading={t("familyChat.availableTasks")} className="px-1 text-xs font-semibold text-slate-400">
                      {tasks.filter(tk => !tk.completed).map((task) => (
                        <CommandItem
                          key={task.id}
                          className="rounded-xl px-3 py-2.5 cursor-pointer mb-1 transition-all hover:bg-rose-50 dark:hover:bg-slate-800/80"
                          onSelect={() => {
                            setMentionedTaskId(task.id)
                            setShowTaskPicker(false)
                          }}
                        >
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="font-semibold text-[14px] text-slate-800 dark:text-slate-200 truncate">{task.title}</span>
                            {task.description && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {task.description}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("chat.placeholder")}
              className="flex-1 min-h-[44px] max-h-32 resize-none border-0 bg-transparent py-3 px-2 text-[15px] shadow-none focus-visible:ring-0 placeholder:text-slate-400 leading-relaxed font-medium text-slate-800 dark:text-slate-100 placeholder:font-normal"
              rows={1}
            />

            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMessage.isPending}
              size="icon"
              className={cn(
                "flex-shrink-0 h-10 w-10 mr-1 rounded-full transition-all duration-300",
                message.trim()
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 translate-y-[-2px]"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 opacity-50"
              )}
            >
              {sendMessage.isPending ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Send className={cn("h-4.5 w-4.5", message.trim() && "ml-0.5")} />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

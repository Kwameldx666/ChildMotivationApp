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

  // Получаем уникальных участников чата
  const chatParticipants = useMemo(() => {
    const participantMap = new Map<string, { id: string; name: string; avatar?: string; isOnline: boolean; role?: string }>()
    
    // Добавляем текущего пользователя
    participantMap.set(currentUserId, {
      id: currentUserId,
      name: currentUserName,
      avatar: currentUserAvatar,
      isOnline: true,
      role: userRole,
    })

    participants.forEach(participant => {
      participantMap.set(participant.id, {
        id: participant.id,
        name: participant.name,
        avatar: participant.avatar ?? undefined,
        isOnline: true,
        role: participant.role,
      })
    })
    
    // Добавляем отправителей из сообщений
    messages.forEach(msg => {
      if (!participantMap.has(msg.senderId)) {
        // Симулируем онлайн статус - если сообщение было в последние 5 минут
        const lastMessageTime = new Date(msg.createdAt).getTime()
        const now = Date.now()
        const isOnline = (now - lastMessageTime) < 5 * 60 * 1000
        
        participantMap.set(msg.senderId, {
          id: msg.senderId,
          name: msg.senderName,
          avatar: msg.senderAvatar,
          isOnline,
        })
      }
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
      "flex flex-col bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-slate-950 dark:to-slate-900",
      fullScreen ? "h-screen" : "h-full min-h-[520px]"
    )}>
      {/* Header */}
      <div className="border-b border-rose-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h1 className="text-sm font-medium text-muted-foreground">
                {chatTitle ?? t("chat.familyChat")}
              </h1>
              <Popover open={showParticipants} onOpenChange={setShowParticipants}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {chatParticipants.length}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-2">
                  <div className="space-y-1">
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">
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
            <div className="flex items-center gap-3 flex-wrap">
              {chatParticipants.filter(p => p.id !== currentUserId).map((participant) => (
                <div key={participant.id} className="flex items-center gap-2">
                  {(() => {
                    const participantName = normalizeDisplayName(participant.name)
                    return (
                      <>
                  <div className="relative">
                    <Avatar className="h-9 w-9 border-2 border-rose-200 dark:border-slate-700">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback className="text-sm bg-gradient-to-br from-rose-400 to-pink-400 text-white">
                        {displayInitial(participantName)}
                      </AvatarFallback>
                    </Avatar>
                    {participant.isOnline && (
                      <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-emerald-500 text-emerald-500 stroke-white dark:stroke-slate-900" strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                      {participantName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {participant.isOnline ? t("familyChat.online") : t("familyChat.offline")}
                    </span>
                  </div>
                      </>
                    )
                  })()}
                </div>
              ))}
              {chatParticipants.filter(p => p.id !== currentUserId).length === 0 && (
                <span className="text-sm text-muted-foreground">{t("familyChat.noParticipants")}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/50 dark:bg-slate-950/30">
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
                      "px-4 py-2.5 shadow-sm relative transition-all duration-200",
                      isOwnMessage
                        ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-2xl rounded-br-sm shadow-rose-500/20"
                        : "bg-white dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl rounded-bl-sm"
                    )}>
                      {mentionedTaskInMsg && (
                        <div className={cn(
                          "mb-2 rounded-xl border p-2.5 text-xs shadow-sm cursor-pointer transition-all hover:scale-[1.02]",
                          isOwnMessage
                            ? "border-white/20 bg-white/10 hover:bg-white/20"
                            : "border-rose-100 dark:border-slate-700/50 bg-rose-50/50 dark:bg-slate-800/50 hover:border-rose-200 dark:hover:border-slate-600"
                        )}>
                          <div className="flex items-center gap-1.5 opacity-90 mb-1">
                            <Hash className="h-3 w-3" />
                            <span className="font-semibold text-[10px] uppercase tracking-wider">{t("familyChat.attachedTask")}</span>
                          </div>
                          <span className="font-medium line-clamp-2 leading-relaxed">{mentionedTaskInMsg.title}</span>
                        </div>
                      )}

                      <p className="text-[14px] whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    </div>
                    
                    <span className={cn(
                      "text-[10px] mt-1.5 font-medium opacity-0 group-hover:opacity-100 transition-opacity",
                      isOwnMessage ? "text-rose-400 dark:text-rose-500/80" : "text-slate-400 dark:text-slate-500"
                    )}>
                      {formatTime(msg.createdAt)}
                    </span>
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
      <div className="border-t border-slate-100 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-3 sm:p-4">
        {mentionedTask && (
          <div className="mb-3 px-4 py-3 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border border-rose-100/50 dark:border-rose-800/30 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-400 to-pink-500" />
            <div className="flex items-start justify-between gap-3 pl-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                  <Hash className="h-3 w-3" />
                  <span>{t("familyChat.attachedTask")}</span>
                </div>
                <p className="text-sm font-medium text-rose-900 dark:text-rose-200 truncate">{mentionedTask.title}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-rose-200 hover:text-rose-700 dark:hover:bg-rose-900 transition-colors opacity-70 hover:opacity-100"
                onClick={() => setMentionedTaskId(null)}
              >
                <Hash className="h-4 w-4 rotate-45" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 bg-slate-100/60 dark:bg-slate-800/50 rounded-[28px] p-1.5 border border-slate-200/60 dark:border-slate-700/60 transition-all focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-rose-300/60 dark:focus-within:border-rose-700/50 focus-within:shadow-sm">
          <Popover open={showTaskPicker} onOpenChange={setShowTaskPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "flex-shrink-0 h-10 w-10 rounded-full transition-colors",
                  mentionedTask 
                    ? "text-rose-600 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/50 dark:text-rose-400"
                    : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                )}
              >
                <Hash className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl border-slate-200 dark:border-slate-800 overflow-hidden" align="start" sideOffset={12}>
              <Command>
                <CommandInput placeholder={t("familyChat.searchTask")} className="border-none focus:ring-0" />
                <CommandList className="max-h-[280px]">
                  <CommandEmpty className="py-6 text-center text-sm text-slate-500">{t("familyChat.noTasksFound")}</CommandEmpty>
                  <CommandGroup heading={t("familyChat.availableTasks")} className="px-1">
                    {tasks.filter(tk => !tk.completed).map((task) => (
                      <CommandItem
                        key={task.id}
                        className="rounded-xl px-3 py-2 cursor-pointer mb-1"
                        onSelect={() => {
                          setMentionedTaskId(task.id)
                          setShowTaskPicker(false)
                        }}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-medium text-sm truncate">{task.title}</span>
                          {task.description && (
                            <span className="text-xs text-muted-foreground truncate opacity-80">
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
            className="flex-1 min-h-[44px] max-h-32 resize-none border-0 bg-transparent py-3 px-1 text-[15px] shadow-none focus-visible:ring-0 placeholder:text-slate-400"
            rows={1}
          />

          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            size="icon"
            className={cn(
              "flex-shrink-0 h-10 w-10 rounded-full transition-all duration-300",
              message.trim()
                ? "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-md hover:scale-105 active:scale-95"
                : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
            )}
          >
            <Send className={cn("h-4 w-4", message.trim() && "ml-0.5")} />
            <span className="sr-only">Send</span>
          </Button>
        </div>

        <div className="flex justify-center mt-2 opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 cursor-default">
            {t("familyChat.taskHintPrefix")} <Hash className="h-2.5 w-2.5" /> {t("familyChat.taskHintSuffix")}
          </p>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Send, ArrowLeft, Hash, Circle } from "lucide-react"
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
}

export default function FamilyChat({
  familyId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  userRole,
  onBack
}: FamilyChatProps) {
  const [message, setMessage] = useState("")
  const [mentionedTaskId, setMentionedTaskId] = useState<string | null>(null)
  const [showTaskPicker, setShowTaskPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const { data: messages = [], isLoading, isFetching, isError } = useFamilyMessages(familyId)
  const { data: tasks = [] } = useTasks()
  const sendMessage = useSendFamilyMessage(familyId)

  const mentionedTask = useMemo(() => {
    if (!mentionedTaskId) return null
    return tasks.find(t => t.id === mentionedTaskId)
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
        title: "Сообщение отправлено",
        variant: "default",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Ошибка отправки",
        description: "Попробуйте ещё раз",
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
      return "Сегодня"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Вчера"
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
    const participants = new Map<string, { id: string; name: string; avatar?: string; isOnline: boolean }>()
    
    // Добавляем текущего пользователя
    participants.set(currentUserId, {
      id: currentUserId,
      name: currentUserName,
      avatar: currentUserAvatar,
      isOnline: true,
    })
    
    // Добавляем отправителей из сообщений
    messages.forEach(msg => {
      if (!participants.has(msg.senderId)) {
        // Симулируем онлайн статус - если сообщение было в последние 5 минут
        const lastMessageTime = new Date(msg.createdAt).getTime()
        const now = Date.now()
        const isOnline = (now - lastMessageTime) < 5 * 60 * 1000
        
        participants.set(msg.senderId, {
          id: msg.senderId,
          name: msg.senderName,
          avatar: msg.senderAvatar,
          isOnline,
        })
      }
    })
    
    return Array.from(participants.values())
  }, [messages, currentUserId, currentUserName, currentUserAvatar])

  // Показываем полноэкранную загрузку только при первой загрузке
  if (isLoading && !messages.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-rose-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-sm font-medium text-muted-foreground mb-2">
              Семейный чат
            </h1>
            {/* Список участников */}
            <div className="flex items-center gap-3 flex-wrap">
              {chatParticipants.filter(p => p.id !== currentUserId).map((participant) => (
                <div key={participant.id} className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-9 w-9 border-2 border-rose-200 dark:border-slate-700">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback className="text-sm bg-gradient-to-br from-rose-400 to-pink-400 text-white">
                        {participant.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {participant.isOnline && (
                      <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-emerald-500 text-emerald-500 stroke-white dark:stroke-slate-900" strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                      {participant.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {participant.isOnline ? "онлайн" : "не в сети"}
                    </span>
                  </div>
                </div>
              ))}
              {chatParticipants.filter(p => p.id !== currentUserId).length === 0 && (
                <span className="text-sm text-muted-foreground">Нет других участников</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {groupedMessages.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-2">
            {/* Date Separator */}
            <div className="flex items-center justify-center">
              <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-xs">
                {formatDate(group.date)}
              </Badge>
            </div>

            {/* Messages */}
            {group.messages.map((msg) => {
              const isOwnMessage = msg.senderId === currentUserId
              const mentionedTaskInMsg = msg.mentionedTaskId 
                ? tasks.find(t => t.id === msg.mentionedTaskId)
                : null
              const senderInfo = chatParticipants.find(p => p.id === msg.senderId)

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 items-end",
                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {!isOwnMessage && (
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.senderAvatar} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-rose-400 to-pink-400 text-white">
                          {msg.senderName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {senderInfo?.isOnline && (
                        <Circle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 fill-emerald-500 text-emerald-500 stroke-white dark:stroke-slate-900" strokeWidth={2} />
                      )}
                    </div>
                  )}

                  <div className={cn(
                    "flex flex-col max-w-[75%]",
                    isOwnMessage ? "items-end" : "items-start"
                  )}>
                    {!isOwnMessage && (
                      <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 px-2 mb-1">
                        {msg.senderName}
                      </span>
                    )}

                    <div className={cn(
                      "rounded-2xl px-3 py-2 shadow-sm",
                      isOwnMessage
                        ? "bg-gradient-to-br from-rose-500 to-pink-500 text-white"
                        : "bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700"
                    )}>
                      {mentionedTaskInMsg && (
                        <div className={cn(
                          "mb-2 rounded-lg border p-2 text-xs",
                          isOwnMessage
                            ? "border-white/20 bg-white/10"
                            : "border-rose-200 dark:border-slate-600 bg-rose-50 dark:bg-slate-700"
                        )}>
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            <span className="font-medium">{mentionedTaskInMsg.title}</span>
                          </div>
                        </div>
                      )}

                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    </div>
                    
                    <span className={cn(
                      "text-[10px] mt-1 px-2",
                      isOwnMessage ? "text-rose-400 dark:text-rose-500" : "text-slate-500 dark:text-slate-400"
                    )}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  {isOwnMessage && (
                    <div className="h-8 w-8 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-rose-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg p-4">
        {mentionedTask && (
          <div className="mb-3 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs font-semibold text-rose-900 dark:text-rose-400">
                  <Hash className="h-3 w-3" />
                  <span>Прикреплена задача:</span>
                </div>
                <p className="mt-1 text-sm text-rose-800 dark:text-rose-300">{mentionedTask.title}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-rose-200 dark:hover:bg-rose-900"
                onClick={() => setMentionedTaskId(null)}
              >
                <Hash className="h-4 w-4 rotate-45" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Popover open={showTaskPicker} onOpenChange={setShowTaskPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0 border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <Hash className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command>
                <CommandInput placeholder="Найти задачу..." />
                <CommandList>
                  <CommandEmpty>Задачи не найдены</CommandEmpty>
                  <CommandGroup heading="Доступные задачи">
                    {tasks.filter(t => !t.completed).map((task) => (
                      <CommandItem
                        key={task.id}
                        onSelect={() => {
                          setMentionedTaskId(task.id)
                          setShowTaskPicker(false)
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{task.title}</span>
                          {task.description && (
                            <span className="text-xs text-muted-foreground truncate">
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
            placeholder="Напишите сообщение..."
            className="min-h-[44px] max-h-32 resize-none border-rose-200 focus-visible:ring-rose-400 dark:border-slate-700"
            rows={1}
          />

          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            className="flex-shrink-0 gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-md"
          >
            <Send className="h-4 w-4" />
            {sendMessage.isPending ? "..." : ""}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          💡 Нажмите <Hash className="h-3 w-3 inline" /> чтобы упомянуть задачу в сообщении
        </p>
      </div>
    </div>
  )
}

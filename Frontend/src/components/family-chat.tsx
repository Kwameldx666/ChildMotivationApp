"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Send, ArrowLeft, Paperclip, Hash, X } from "lucide-react"
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
    const participants = new Map<string, { id: string; name: string; avatar?: string }>()
    
    // Добавляем текущего пользователя
    participants.set(currentUserId, {
      id: currentUserId,
      name: currentUserName,
      avatar: currentUserAvatar,
    })
    
    // Добавляем отправителей из сообщений
    messages.forEach(msg => {
      if (!participants.has(msg.senderId)) {
        participants.set(msg.senderId, {
          id: msg.senderId,
          name: msg.senderName,
          avatar: msg.senderAvatar,
        })
      }
    })
    
    return Array.from(participants.values())
  }, [messages, currentUserId, currentUserName, currentUserAvatar])

  // Показываем полноэкранную загрузку только при первой загрузке
  if (isLoading && !messages.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg px-4 py-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Семейный чат</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                Участники:
              </p>
              <div className="flex -space-x-2">
                {chatParticipants.slice(0, 5).map((participant) => (
                  <Avatar 
                    key={participant.id} 
                    className="h-6 w-6 border-2 border-background"
                    title={participant.name}
                  >
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback className="text-[10px]">
                      {participant.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {chatParticipants.map(p => p.name).join(", ")}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <div className={cn(
              "h-2 w-2 rounded-full transition-all",
              isFetching ? "bg-yellow-500 animate-pulse" : "bg-emerald-500"
            )} />
            {isFetching ? "Обновление..." : "Онлайн"}
          </Badge>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {groupedMessages.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-4">
            {/* Date Separator */}
            <div className="flex items-center justify-center">
              <Badge variant="secondary" className="rounded-full px-4 py-1">
                {formatDate(group.date)}
              </Badge>
            </div>

            {/* Messages */}
            {group.messages.map((msg) => {
              const isOwnMessage = msg.senderId === currentUserId
              const mentionedTaskInMsg = msg.mentionedTaskId 
                ? tasks.find(t => t.id === msg.mentionedTaskId)
                : null

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={msg.senderAvatar} />
                      <AvatarFallback>{msg.senderName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}

                  <div className={cn(
                    "flex flex-col gap-1 max-w-[70%]",
                    isOwnMessage ? "items-end" : "items-start"
                  )}>
                    {!isOwnMessage && (
                      <span className="text-xs font-medium text-muted-foreground px-3">
                        {msg.senderName}
                      </span>
                    )}

                    <Card className={cn(
                      "p-3",
                      isOwnMessage
                        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                        : "bg-white dark:bg-slate-800"
                    )}>
                      {mentionedTaskInMsg && (
                        <div className={cn(
                          "mb-2 rounded-lg border p-2 text-xs",
                          isOwnMessage
                            ? "border-primary-foreground/20 bg-primary-foreground/10"
                            : "border-border bg-muted"
                        )}>
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            <span className="font-semibold">Задача:</span>
                          </div>
                          <p className="mt-1">{mentionedTaskInMsg.title}</p>
                        </div>
                      )}

                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>

                      <span className={cn(
                        "text-[10px] mt-2 block",
                        isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </Card>
                  </div>

                  {isOwnMessage && (
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={currentUserAvatar} />
                      <AvatarFallback>{currentUserName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg p-4">
        {mentionedTask && (
          <Card className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs font-semibold text-blue-900 dark:text-blue-400">
                  <Hash className="h-3 w-3" />
                  <span>Прикреплена задача:</span>
                </div>
                <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">{mentionedTask.title}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setMentionedTaskId(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        <div className="flex gap-2">
          <Popover open={showTaskPicker} onOpenChange={setShowTaskPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0"
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
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />

          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            className="flex-shrink-0 gap-2"
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

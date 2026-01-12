"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import FamilyChat from "./family-chat"

interface FamilyChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
  userRole: "parent" | "child"
}

export default function FamilyChatModal({
  open,
  onOpenChange,
  familyId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  userRole
}: FamilyChatModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
        <FamilyChat
          familyId={familyId}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserAvatar={currentUserAvatar}
          userRole={userRole}
          onBack={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

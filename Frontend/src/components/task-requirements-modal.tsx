"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Save } from "lucide-react"
import { useTranslation } from "@/i18n/provider"

interface TaskRequirementsModalProps {
  open: boolean
  onClose: () => void
  taskTitle: string
  onSave: (requirements: { type: string; description: string }) => void
}

export default function TaskRequirementsModal({ open, onClose, taskTitle, onSave }: TaskRequirementsModalProps) {
  const { t } = useTranslation()
  const [requirementType, setRequirementType] = useState("photo")
  const [description, setDescription] = useState("")

  const handleSave = () => {
    onSave({
      type: requirementType,
      description,
    })
    setDescription("")
    setRequirementType("photo")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("taskRequirements.title", { taskTitle })}</DialogTitle>
          <DialogDescription>{t("taskRequirements.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Confirmation type */}
          <div className="space-y-3">
            <Label className="text-base font-medium">{t("taskRequirements.confirmationType")}</Label>
            <RadioGroup value={requirementType} onValueChange={setRequirementType}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="photo" id="photo" />
                <Label htmlFor="photo" className="cursor-pointer flex-1">
                  <span className="font-medium">{t("taskRequirements.photoLabel")}</span>
                  <p className="text-sm text-muted-foreground">{t("taskRequirements.photoDescription")}</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="cursor-pointer flex-1">
                  <span className="font-medium">{t("taskRequirements.videoLabel")}</span>
                  <p className="text-sm text-muted-foreground">{t("taskRequirements.videoDescription")}</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="checklist" id="checklist" />
                <Label htmlFor="checklist" className="cursor-pointer flex-1">
                  <span className="font-medium">{t("taskRequirements.checklistLabel")}</span>
                  <p className="text-sm text-muted-foreground">{t("taskRequirements.checklistDescription")}</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Detailed requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements" className="text-base font-medium">
              {t("taskRequirements.detailedRequirements")}
            </Label>
            <Textarea
              id="requirements"
              placeholder={
                requirementType === "photo"
                  ? t("taskRequirements.photoPlaceholder")
                  : requirementType === "video"
                    ? t("taskRequirements.videoPlaceholder")
                    : t("taskRequirements.checklistPlaceholder")
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{t("taskRequirements.requirementsHint")}</p>
          </div>

          {/* Preview */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">{t("taskRequirements.childPreview")}</p>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <span className="font-semibold">{t("taskRequirements.typeLabel")}</span>{" "}
                {requirementType === "photo" ? t("taskRequirements.photoLabel") : requirementType === "video" ? t("taskRequirements.videoLabel") : t("taskRequirements.checklistLabel")}
              </p>
              {description && (
                <p>
                  <span className="font-semibold">{t("taskRequirements.requirementsLabel")}</span> {description}
                </p>
              )}
            </div>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="bg-transparent">
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={!description}>
            <Save className="w-4 h-4" />
            {t("taskRequirements.saveRequirements")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

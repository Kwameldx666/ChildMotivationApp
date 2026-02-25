"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react"
import { useTranslation } from "@/i18n/provider"

import type { TaskEvidenceRequirement } from "@/services/tasks-service"

export type EditableTask = {
  id: string
  title: string
  description: string
  difficulty: number
  category: string
  confirmationType?: TaskEvidenceRequirement
}

const EMPTY_TASK: EditableTask = {
  id: "",
  title: "",
  description: "",
  difficulty: 1,
  category: "home",
  confirmationType: "none",
}

interface TaskEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: EditableTask | null
  onSave: (updatedTask: EditableTask) => void
}

export default function TaskEditModal({ open, onOpenChange, task, onSave }: TaskEditModalProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<EditableTask>(() => task ?? EMPTY_TASK)

  useEffect(() => {
    if (task) setFormData(task)
  }, [task])

  if (!task) return null

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("taskEdit.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t("taskEdit.nameLabel")}</label>
            <Input
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t("taskEdit.namePlaceholder")}
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t("taskEdit.descriptionLabel")}</label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("taskEdit.descriptionPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t("taskEdit.difficultyLabel")}</label>
              <select
                value={formData.difficulty || 1}
                onChange={(e) => setFormData({ ...formData, difficulty: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {"⭐".repeat(n)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">{t("taskEdit.categoryLabel")}</label>
              <select
                value={formData.category || ""}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="home">{t("taskEdit.categoryHome")}</option>
                <option value="study">{t("taskEdit.categoryStudy")}</option>
                <option value="pets">{t("taskEdit.categoryPets")}</option>
                <option value="help">{t("taskEdit.categoryHelp")}</option>
              </select>
            </div>
          </div>

          {/* Read-only computed rewards + confirmation toggle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t("taskEdit.rewardLabel")}</label>
              <div className="rounded-md border px-3 py-2 text-sm">
                {60 + formData.difficulty * 20} XP • {({
                  1: 2,
                  2: 5,
                  3: 10,
                  4: 20,
                  5: 50,
                } as Record<number, number>)[formData.difficulty] ?? 0} pts
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">{t("taskEdit.confirmationLabel")}</label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="requiresConfirmation"
                  type="checkbox"
                  checked={formData.confirmationType === "photo"}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmationType: e.target.checked ? "photo" : "none" })
                  }
                />
                <label htmlFor="requiresConfirmation" className="text-sm">
                  {formData.confirmationType === "photo" ? t("taskEdit.photoVideo") : t("taskEdit.noConfirmation")}
                </label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("taskEdit.cancel")}
          </Button>
          <Button onClick={handleSave} className="bg-linear-to-r from-primary to-secondary">
            {t("taskEdit.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

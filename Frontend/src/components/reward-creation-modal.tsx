"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Sparkles, Star, ChevronDown, Pencil } from "lucide-react"
import { aiService } from "@/services/ai-service"
import { useToast } from "@/hooks/use-toast"
import { useFamilyMembers } from "@/services/family-queries"
import { useShopProducts } from "@/services/shop-queries"
import { useTranslation } from "@/i18n/provider"
import { useSubscriptionGate } from "@/hooks/use-subscription-gate"
import { cn } from "@/lib/utils"

/* Cost presets: category → default points */
const COST_PRESETS = [
  { id: "instant", default: 30, emoji: "⚡" },
  { id: "medium", default: 150, emoji: "🎯" },
  { id: "big", default: 400, emoji: "🏆" },
] as const

type CostCategory = typeof COST_PRESETS[number]["id"] | null

interface RewardCreationModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (reward: { title: string; description: string; cost: number; stock: number }) => void | Promise<void>
  isSubmitting?: boolean
}

export default function RewardCreationModal({ open, onClose, onSubmit, isSubmitting = false }: RewardCreationModalProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { data: familyMembers = [] } = useFamilyMembers()
  const { data: existingProducts = [] } = useShopProducts()
  const { hasFeature } = useSubscriptionGate()
  const canUseAi = hasFeature('aiAssistant')

  const children = familyMembers.filter(m => m.role === 'child')

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [cost, setCost] = useState("")
  const [stock, setStock] = useState("1")
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [costCategory, setCostCategory] = useState<CostCategory>(null)
  const [customCost, setCustomCost] = useState(false)

  // AI guidance state
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [aiHint, setAiHint] = useState("")
  const [aiExpanded, setAiExpanded] = useState(false)

  const selectedChild = children.find(c => c.id === selectedChildId)

  const handleAiGenerate = async () => {
    setIsAiGenerating(true)
    try {
      const recentRewards = existingProducts.slice(0, 5).map(p => p.name)
      const child = selectedChild || children[0]

      // Build occasion string with child info + user hint
      const parts: string[] = []
      if (child) parts.push(`Child: ${child.name}${child.age ? `, age ${child.age}` : ""}`)
      if (aiHint.trim()) parts.push(aiHint.trim())
      const occasion = parts.length ? parts.join(". ") : undefined

      const response = await aiService.getRewardSuggestions({
        maxSuggestions: 1,
        childId: child?.id,
        interests: [],
        recentlyPurchasedRewards: recentRewards,
        occasion,
      })

      const suggestions = response.suggestions || (response as any).Suggestions || []
      if (suggestions.length > 0) {
        const s = suggestions[0]
        const aiTitle = (s.title || (s as any).Title || "").toString().replace(/^undefined\s*/i, "").trim()
        const aiDesc = (s.description || (s as any).Description || "").toString().replace(/^undefined\s*/i, "").trim()
        const aiCost = s.cost || (s as any).Cost || 100
        if (aiTitle) setTitle(aiTitle)
        if (aiDesc) setDescription(aiDesc)
        setCost(String(aiCost))
        // Match the AI cost to a category, or enter custom mode
        const matched = COST_PRESETS.find(p => Math.abs(p.default - aiCost) <= p.default * 0.3)
        if (matched) {
          setCostCategory(matched.id)
          setCustomCost(false)
        } else {
          setCostCategory(null)
          setCustomCost(true)
        }
        toast({ title: t("rewardCreation.toast.aiGenerated") })
      }
    } catch (error: any) {
      console.error('[reward-creation-modal] AI generation failed', error)
      toast({
        title: t("rewardCreation.toast.generationError"),
        description: error?.message || t("rewardCreation.errors.default"),
        variant: "destructive",
      })
    } finally {
      setIsAiGenerating(false)
    }
  }

  const handleSubmit = async () => {
    if (!title || !cost) return
    try {
      await onSubmit({
        title,
        description,
        cost: Number.parseInt(cost, 10),
        stock: Math.max(1, Number.parseInt(stock, 10) || 1),
      })
      setTitle("")
      setDescription("")
      setCost("")
      setStock("1")
      setAiHint("")
      setSelectedChildId(null)
      setCostCategory(null)
      setCustomCost(false)
      onClose()
    } catch (error) {
      console.error("[reward-creation-modal] Failed to submit reward", error)
    }
  }

  const busy = isSubmitting || isAiGenerating

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="text-lg font-semibold">{t("rewardCreation.title")}</DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Name */}
          <div>
            <Label className="text-xs text-muted-foreground">{t("rewardCreation.rewardName")}</Label>
            <Input
              className="mt-1.5 rounded-xl h-11 bg-muted/30 text-base"
              placeholder={t("rewardCreation.rewardNamePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs text-muted-foreground">{t("rewardCreation.description")}</Label>
            <Textarea
              className="mt-1.5 rounded-xl resize-none bg-muted/30 text-sm"
              rows={2}
              placeholder={t("rewardCreation.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
            />
          </div>

          {/* Cost — category picker */}
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              {t("rewardCreation.costInPoints")}
            </Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {COST_PRESETS.map(preset => {
                const active = costCategory === preset.id && !customCost
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setCostCategory(preset.id)
                      setCost(String(preset.default))
                      setCustomCost(false)
                    }}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border text-center transition-all",
                      active
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border bg-muted/30 hover:border-primary/40"
                    )}
                  >
                    <span className="text-base leading-none">{preset.emoji}</span>
                    <span className="text-[11px] font-medium leading-tight">
                      {t(`rewardCreation.categories.${preset.id}.label`).replace(/^[^\s]+\s/, "")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">~{preset.default} {t("rewardCreation.points")}</span>
                  </button>
                )
              })}
            </div>
            {/* Fine-tune: show inline input */}
            {cost && (
              <div className="flex items-center gap-2 mt-2">
                {customCost ? (
                  <Input
                    type="number"
                    min="1"
                    step="5"
                    className="rounded-xl h-9 bg-muted/30 w-28 text-sm"
                    value={cost}
                    onChange={(e) => {
                      setCost(e.target.value)
                      setCostCategory(null)
                    }}
                    disabled={busy}
                    autoFocus
                  />
                ) : (
                  <span className="text-sm font-medium tabular-nums">
                    {cost} {t("rewardCreation.points")}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setCustomCost(v => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  {customCost ? t("common.done") : t("rewardCreation.adjustCost")}
                </button>
              </div>
            )}
            {costCategory && !customCost && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {t(`rewardCreation.categories.${costCategory}.examples`)}
              </p>
            )}
          </div>

          {/* Stock */}
          <div>
            <Label className="text-xs text-muted-foreground">{t("rewardCreation.stockCount")}</Label>
            <Input
              type="number"
              min="1"
              className="mt-1.5 rounded-xl h-11 bg-muted/30 w-24"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              disabled={busy}
            />
          </div>

          {/* AI section — collapsible */}
          {canUseAi && (
            <div className="rounded-xl border border-dashed border-primary/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setAiExpanded(v => !v)}
                disabled={busy}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t("rewardCreation.generateWithAi")}
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", aiExpanded && "rotate-180")} />
              </button>

              {aiExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-dashed border-primary/20 pt-3">
                  {/* Child selector */}
                  {children.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("rewardCreation.forWhom")}</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedChildId(null)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            selectedChildId === null
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40"
                          )}
                        >
                          {t("rewardCreation.forAllChildren")}
                        </button>
                        {children.map(child => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => setSelectedChildId(child.id)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                              selectedChildId === child.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40"
                            )}
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI hint */}
                  <div>
                    <Label className="text-xs text-muted-foreground">{t("rewardCreation.aiHint")}</Label>
                    <Input
                      className="mt-1.5 rounded-xl h-10 bg-muted/30 text-sm"
                      placeholder={selectedChild
                        ? t("rewardCreation.aiHintPlaceholderChild")
                        : t("rewardCreation.aiHintPlaceholder")
                      }
                      value={aiHint}
                      onChange={(e) => setAiHint(e.target.value)}
                      disabled={busy}
                    />
                  </div>

                  {/* Generate button */}
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleAiGenerate}
                    disabled={busy}
                    className="w-full rounded-xl h-10 gap-2"
                  >
                    {isAiGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("rewardCreation.generating")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {t("rewardCreation.generateWithAi")}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-11"
              onClick={onClose}
              disabled={busy}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1 rounded-xl h-11 gap-2"
              onClick={handleSubmit}
              disabled={!title || !cost || busy}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isSubmitting ? t("rewardCreation.saving") : t("rewardCreation.createReward")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

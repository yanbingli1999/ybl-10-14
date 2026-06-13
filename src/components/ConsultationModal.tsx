import { useMemo, useState } from "react";
import { X, Users, Brain, Clock, Zap, ChevronRight, Sparkles, AlertTriangle } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { BREEDS, DISEASE_NAMES, SEVERITY_NAMES, SEVERITY_COLORS, CONSULTATION_CONFIG } from "@/data/gameData";
import type { ConsultationOpinion, DiseaseType } from "@/types/game";

interface ConsultationModalProps {
  open: boolean;
  onClose: () => void;
  onAdopt: (opinion: ConsultationOpinion | null) => void;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (confidence >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-gray-500 bg-gray-50 border-gray-200";
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 85) return "非常可信";
  if (confidence >= 70) return "比较可信";
  if (confidence >= 55) return "一般";
  return "仅供参考";
}

function getFatigueColor(fatigue: number): string {
  if (fatigue >= 70) return "text-red-500";
  if (fatigue >= 40) return "text-amber-500";
  return "text-emerald-500";
}

function getFatigueBarColor(fatigue: number): string {
  if (fatigue >= 70) return "bg-red-400";
  if (fatigue >= 40) return "bg-amber-400";
  return "bg-emerald-400";
}

export function ConsultationModal({ open, onClose, onAdopt }: ConsultationModalProps) {
  const selectedBeastId = useGameStore(s => s.selectedBeastId);
  const queue = useGameStore(s => s.waitingQueue);
  const staff = useGameStore(s => s.staff);
  const currentConsultation = useGameStore(s => s.currentConsultation);
  const consultationBeastId = useGameStore(s => s.consultationBeastId);
  const startConsultation = useGameStore(s => s.startConsultation);
  const clearConsultation = useGameStore(s => s.clearConsultation);

  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [adoptedOpinion, setAdoptedOpinion] = useState<ConsultationOpinion | null>(null);

  const beast = useMemo(() => queue.find(b => b.id === selectedBeastId), [queue, selectedBeastId]);
  const breed = beast ? BREEDS.find(b => b.id === beast.breedId) : null;

  const idleStaff = useMemo(() => staff.filter(s => s.status === "idle"), [staff]);
  const canConsult = selectedStaffIds.length > 0 && selectedStaffIds.every(id => {
    const s = staff.find(x => x.id === id);
    return s && s.fatigue < CONSULTATION_CONFIG.maxFatigue;
  });

  const toggleStaff = (staffId: string) => {
    setSelectedStaffIds(prev => {
      if (prev.includes(staffId)) return prev.filter(id => id !== staffId);
      return [...prev, staffId];
    });
  };

  const handleStartConsultation = () => {
    if (!beast || !canConsult) return;
    startConsultation(beast.id, selectedStaffIds);
  };

  const handleAdopt = (opinion: ConsultationOpinion) => {
    setAdoptedOpinion(opinion);
    onAdopt(opinion);
    onClose();
  };

  const handleSkip = () => {
    setAdoptedOpinion(null);
    onAdopt(null);
  };

  const handleClose = () => {
    clearConsultation();
    setSelectedStaffIds([]);
    setAdoptedOpinion(null);
    onClose();
  };

  if (!open || !beast || !breed) return null;

  const hasConsultation = currentConsultation && consultationBeastId === beast.id;
  const sortedOpinions = hasConsultation
    ? [...currentConsultation].sort((a, b) => b.confidence - a.confidence)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-lg bg-clinic-card shadow-2xl h-full flex flex-col border-l-2 border-clinic-border/60 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-clinic-border/40 bg-gradient-to-r from-clinic-amber/10 via-white to-clinic-jade/10 flex-shrink-0">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-inner border border-clinic-border/50 flex items-center justify-center text-3xl flex-shrink-0">
            {breed.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-lg text-clinic-deep">{beast.name}</h3>
              <span className="text-[11px] text-gray-500">{breed.name}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap text-xs">
              <span className={`tag border ${SEVERITY_COLORS[beast.severity]}`}>
                {SEVERITY_NAMES[beast.severity]}
              </span>
              <span className="text-gray-500">💝 {beast.satisfaction}</span>
              <span className="text-gray-500">⏳ 等{beast.waitHours}h</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-clinic-crisis hover:bg-red-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* 症状展示 */}
          <div className="card p-3 border-clinic-jade/20">
            <div className="font-display text-sm text-clinic-deep flex items-center gap-1.5 mb-2">
              <Brain className="w-4 h-4 text-clinic-jade" />
              症状观察
            </div>
            <div className="flex flex-wrap gap-1.5">
              {beast.symptoms.map(s => (
                <span key={s} className="tag bg-white border border-clinic-jade/30 text-clinic-deep text-xs shadow-sm">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* 选择护理员 */}
          {!hasConsultation && (
            <div className="card p-3 border-clinic-amber/20">
              <div className="font-display text-sm text-clinic-deep flex items-center gap-1.5 mb-2">
                <Users className="w-4 h-4 text-clinic-amber" />
                邀请会诊
                <span className="ml-auto text-[11px] text-gray-500">
                  已选 {selectedStaffIds.length} 人
                </span>
              </div>
              <div className="text-[11px] text-gray-500 mb-2">
                疑难病例可邀请空闲护理员会诊，每人根据技能和疲劳给出不同可信度的建议。
                会诊消耗 <Clock className="inline w-3 h-3" /> {CONSULTATION_CONFIG.baseDurationHours} 小时，
                增加 <Zap className="inline w-3 h-3" /> {CONSULTATION_CONFIG.fatigueIncreasePerConsult} 点疲劳度。
              </div>
              <div className="space-y-2">
                {idleStaff.length === 0 && (
                  <div className="text-center py-3 text-gray-400 text-xs italic">
                    暂无空闲护理员
                  </div>
                )}
                {idleStaff.map(s => {
                  const selected = selectedStaffIds.includes(s.id);
                  const tooTired = s.fatigue >= CONSULTATION_CONFIG.maxFatigue;
                  const disabled = tooTired;
                  return (
                    <button
                      key={s.id}
                      onClick={() => !disabled && toggleStaff(s.id)}
                      disabled={disabled}
                      className={`w-full p-2.5 rounded-lg border text-left transition-all ${
                        selected
                          ? "border-clinic-amber bg-clinic-amber/10 shadow-sm"
                          : disabled
                          ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                          : "border-clinic-border/50 bg-white hover:border-clinic-amber/60 hover:bg-amber-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{s.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-clinic-deep">{s.name}</div>
                          <div className="text-[11px] text-gray-500">
                            {s.title} · Lv.{s.skillLevel}
                          </div>
                        </div>
                        {tooTired && (
                          <span className="text-[10px] text-red-500 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            过度疲劳
                          </span>
                        )}
                        {selected && (
                          <Sparkles className="w-4 h-4 text-clinic-amber" />
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                          <span>疲劳度</span>
                          <span className={getFatigueColor(s.fatigue)}>{s.fatigue}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getFatigueBarColor(s.fatigue)}`}
                            style={{ width: `${s.fatigue}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-1.5 text-[10px] text-gray-400">
                        预计可信度：约 {Math.max(
                          CONSULTATION_CONFIG.minConfidence,
                          CONSULTATION_CONFIG.baseConfidence + s.skillLevel * CONSULTATION_CONFIG.skillConfidenceBonus - s.fatigue * CONSULTATION_CONFIG.fatigueConfidencePenalty
                        )}%
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleStartConsultation}
                disabled={!canConsult}
                className="w-full mt-3 py-2 rounded-lg btn-primary text-sm flex items-center justify-center gap-1.5 disabled:!bg-gray-300"
              >
                <Users className="w-4 h-4" />
                开始会诊
              </button>
            </div>
          )}

          {/* 会诊结果 */}
          {hasConsultation && (
            <div className="card p-3 border-clinic-light-jade/20">
              <div className="font-display text-sm text-clinic-deep flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-clinic-light-jade" />
                会诊意见
                <span className="ml-auto text-[11px] text-gray-500">
                  共 {sortedOpinions.length} 位参与
                </span>
              </div>
              <div className="text-[11px] text-gray-500 mb-3">
                点击下方意见可采纳为诊断结果，正确的会诊诊断可提升诊金收益。
              </div>
              <div className="space-y-2.5">
                {sortedOpinions.map((op, idx) => (
                  <div
                    key={op.staffId}
                    className={`p-2.5 rounded-lg border transition-all ${
                      adoptedOpinion?.staffId === op.staffId
                        ? "border-clinic-jade bg-clinic-jade/10 shadow-sm"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">{op.staffEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-clinic-deep">
                          {op.staffName}
                          {idx === 0 && <span className="ml-1 text-[10px] text-amber-600">⭐最可信</span>}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Lv.{op.skillLevel} · 疲劳 {op.fatigue}%
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getConfidenceColor(op.confidence)}`}>
                        {op.confidence}% · {getConfidenceLabel(op.confidence)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">诊断：</span>
                      <span className="font-medium text-clinic-deep">
                        {DISEASE_NAMES[op.diagnosis as DiseaseType]}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-gray-600 italic">
                      「{op.reasoning}」
                    </div>
                    <button
                      onClick={() => handleAdopt(op)}
                      className={`w-full mt-2 py-1.5 rounded text-[11px] font-medium transition-all ${
                        adoptedOpinion?.staffId === op.staffId
                          ? "bg-clinic-jade text-white"
                          : "bg-clinic-amber/20 text-clinic-deep hover:bg-clinic-amber/30"
                      }`}
                    >
                      {adoptedOpinion?.staffId === op.staffId ? "✓ 已采纳" : "采纳此意见"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
                💡 提示：采纳正确的诊断意见，可获得 +{Math.floor(CONSULTATION_CONFIG.correctDiagnosisRevenueBonus * 100)}% 诊金加成
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="p-3 border-t border-clinic-border/40 bg-gradient-to-r from-clinic-jade/10 via-white to-clinic-amber/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="flex-1 py-2 rounded-lg border-2 border-clinic-border/60 text-gray-600 hover:bg-white/80 transition-colors text-sm"
            >
              {hasConsultation ? "取消" : "返回"}
            </button>
            {hasConsultation && (
              <button
                onClick={handleSkip}
                className="flex-1 py-2 rounded-lg btn-primary text-sm flex items-center justify-center gap-1.5"
              >
                不采纳，自主诊断
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

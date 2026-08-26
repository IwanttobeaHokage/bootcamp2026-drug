import { useState } from "react";
import type {
  AnalysisRequest,
  DoseUnit,
  Medication,
  Sex,
  Supplement,
  TimeSlot,
} from "@/types/analysis";

const DOSE_UNITS: DoseUnit[] = ["mg", "g", "mcg", "ml", "iu", "tablet", "capsule", "softgel", "scoop"];

const TIME_SLOT_LABEL: Record<TimeSlot, string> = {
  morning: "아침",
  noon: "점심",
  evening: "저녁",
  bedtime: "취침 전",
  before_meal: "식전",
  with_meal: "식사와 함께",
  after_meal: "식후",
  empty_stomach: "공복",
};

const emptySupplement: Supplement = {
  supplementName: "",
  doseAmount: 0,
  doseUnit: "mg",
  doseFrequency: 1,
  intakeTime: "after_meal",
};

interface Props {
  isLoading: boolean;
  onSubmit: (request: AnalysisRequest) => void;
}

export function SupplementForm({ isLoading, onSubmit }: Props) {
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<Sex>("female");
  const [weightKg, setWeightKg] = useState(60);
  const [supplements, setSupplements] = useState<Supplement[]>([emptySupplement]);
  const [medications, setMedications] = useState<Medication[]>([]);

  const updateSupplement = (index: number, patch: Partial<Supplement>) => {
    setSupplements((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      userProfile: { age, sex, weightKg },
      supplements,
      // 빈 이름은 보내지 않는다.
      medications: medications.filter((med) => med.medicationName.trim() !== ""),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>내 정보</legend>
        <label>
          나이
          <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />
        </label>
        <label>
          성별
          <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
            <option value="female">여성</option>
            <option value="male">남성</option>
            <option value="other">기타</option>
          </select>
        </label>
        <label>
          체중(kg)
          <input
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>먹고 있는 영양제</legend>
        {supplements.map((item, index) => (
          <div key={index}>
            <input
              placeholder="영양제 이름 (예: 비타민 D 1000IU)"
              value={item.supplementName}
              onChange={(e) => updateSupplement(index, { supplementName: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="1회 섭취량"
              value={item.doseAmount}
              onChange={(e) => updateSupplement(index, { doseAmount: Number(e.target.value) })}
            />
            <select
              value={item.doseUnit}
              onChange={(e) => updateSupplement(index, { doseUnit: e.target.value as DoseUnit })}
            >
              {DOSE_UNITS.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="1일 횟수"
              value={item.doseFrequency}
              onChange={(e) => updateSupplement(index, { doseFrequency: Number(e.target.value) })}
            />
            <select
              value={item.intakeTime}
              onChange={(e) => updateSupplement(index, { intakeTime: e.target.value as TimeSlot })}
            >
              {Object.entries(TIME_SLOT_LABEL).map(([slot, label]) => (
                <option key={slot} value={slot}>{label}</option>
              ))}
            </select>
          </div>
        ))}
        <button type="button" onClick={() => setSupplements((prev) => [...prev, emptySupplement])}>
          영양제 추가
        </button>
      </fieldset>

      <fieldset>
        <legend>복용 중인 약 (선택)</legend>
        <p>
          약을 적어주면 그 약과 부딪히는 영양제가 있는지 함께 확인합니다. 없으면 비워두세요.
        </p>
        {medications.map((med, index) => (
          <input
            key={index}
            placeholder="약 이름 (예: 와파린)"
            value={med.medicationName}
            onChange={(e) =>
              setMedications((prev) =>
                prev.map((item, i) =>
                  i === index ? { ...item, medicationName: e.target.value } : item,
                ),
              )
            }
          />
        ))}
        <button
          type="button"
          onClick={() => setMedications((prev) => [...prev, { medicationName: "" }])}
        >
          약 추가
        </button>
      </fieldset>

      <button type="submit" disabled={isLoading}>
        {isLoading ? "분석 중..." : "분석하기"}
      </button>
    </form>
  );
}

import { useState } from "react";
import type { AnalysisRequest, DoseUnit, Medication, Sex, TimeSlot } from "types/analysis";

const DOSE_UNITS: DoseUnit[] = ["mg", "g", "mcg", "ml", "iu", "tablet", "capsule"];
const TIME_SLOTS: TimeSlot[] = [
  "morning", "noon", "evening", "bedtime",
  "before_meal", "with_meal", "after_meal", "empty_stomach",
];

const emptyMedication: Medication = {
  medicationName: "",
  doseAmount: 0,
  doseUnit: "mg",
  doseFrequency: 1,
  intakeTime: "after_meal",
};

interface Props {
  isLoading: boolean;
  onSubmit: (request: AnalysisRequest) => void;
}

export function MedicationForm({ isLoading, onSubmit }: Props) {
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<Sex>("male");
  const [weightKg, setWeightKg] = useState(65);
  const [medications, setMedications] = useState<Medication[]>([emptyMedication]);

  const updateMedication = (index: number, patch: Partial<Medication>) => {
    setMedications((prev) => prev.map((med, i) => (i === index ? { ...med, ...patch } : med)));
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ userProfile: { age, sex, weightKg }, medications });
      }}
    >
      <fieldset>
        <legend>내 정보</legend>
        <label>
          나이
          <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />
        </label>
        <label>
          성별
          <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
            <option value="male">남성</option>
            <option value="female">여성</option>
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
        <legend>복용 중인 약</legend>
        {medications.map((med, index) => (
          <div key={index}>
            <input
              placeholder="약 이름"
              value={med.medicationName}
              onChange={(e) => updateMedication(index, { medicationName: e.target.value })}
            />
            <input
              type="number"
              placeholder="1회 복용량"
              value={med.doseAmount}
              onChange={(e) => updateMedication(index, { doseAmount: Number(e.target.value) })}
            />
            <select
              value={med.doseUnit}
              onChange={(e) => updateMedication(index, { doseUnit: e.target.value as DoseUnit })}
            >
              {DOSE_UNITS.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="1일 횟수"
              value={med.doseFrequency}
              onChange={(e) => updateMedication(index, { doseFrequency: Number(e.target.value) })}
            />
            <select
              value={med.intakeTime}
              onChange={(e) => updateMedication(index, { intakeTime: e.target.value as TimeSlot })}
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        ))}
        <button type="button" onClick={() => setMedications((prev) => [...prev, emptyMedication])}>
          약 추가
        </button>
      </fieldset>

      <button type="submit" disabled={isLoading}>
        {isLoading ? "분석 중..." : "분석하기"}
      </button>
    </form>
  );
}

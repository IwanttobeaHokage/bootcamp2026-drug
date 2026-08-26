import { useState, type FormEvent } from "react";
import {
  CFU_UNITS,
  DOSE_UNITS,
  DOSE_UNIT_LABEL,
  TIME_SLOTS,
  TIME_SLOT_LABEL,
} from "@/constants/labels";
import type {
  AnalysisRequest,
  DoseUnit,
  Medication,
  Sex,
  Supplement,
  TimeSlot,
} from "@/types/analysis";

const DEFAULT_TIME: TimeSlot = "morning_after_meal";

/** 행마다 새 객체를 만든다. 같은 참조를 여러 행이 공유하지 않도록. */
const createSupplement = (): Supplement => ({
  supplementName: "",
  doseAmount: 1,
  doseUnit: "mg",
  doseFrequency: 1,
  intakeTimes: [DEFAULT_TIME],
});

/**
 * 1일 n회면 시각도 n개다 (백엔드가 개수를 검사한다).
 * 횟수를 늘리면 뒤에 기본값을 채우고, 줄이면 뒤에서 잘라낸다.
 */
const resizeIntakeTimes = (times: TimeSlot[], frequency: number): TimeSlot[] =>
  Array.from({ length: frequency }, (_, i) => times[i] ?? DEFAULT_TIME);

interface Props {
  isLoading: boolean;
  onSubmit: (request: AnalysisRequest) => void;
}

export function SupplementForm({ isLoading, onSubmit }: Props) {
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<Sex>("female");
  const [weightKg, setWeightKg] = useState(60);
  const [supplements, setSupplements] = useState<Supplement[]>([createSupplement()]);
  const [medications, setMedications] = useState<Medication[]>([]);

  const updateSupplement = (index: number, patch: Partial<Supplement>) => {
    setSupplements((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        // 횟수가 바뀌면 시각 칸 개수도 따라간다.
        return { ...next, intakeTimes: resizeIntakeTimes(next.intakeTimes, next.doseFrequency) };
      }),
    );
  };

  const updateIntakeTime = (index: number, slotIndex: number, value: TimeSlot) => {
    setSupplements((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, intakeTimes: item.intakeTimes.map((t, j) => (j === slotIndex ? value : t)) }
          : item,
      ),
    );
  };

  const removeSupplement = (index: number) => {
    // supplements 는 1개 이상이어야 한다 (docs/API.md).
    setSupplements((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const updateMedication = (index: number, patch: Partial<Medication>) => {
    setMedications((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleSubmit = (event: FormEvent) => {
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
      <fieldset className="card">
        <legend className="card__legend">내 정보</legend>
        <div className="field-grid">
          <div className="field">
            <label className="field__label" htmlFor="profile-age">
              나이
            </label>
            <input
              id="profile-age"
              type="number"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              required
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="profile-sex">
              성별
            </label>
            <select
              id="profile-sex"
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex)}
            >
              <option value="female">여성</option>
              <option value="male">남성</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="profile-weightKg">
              체중 (kg)
            </label>
            <input
              id="profile-weightKg"
              type="number"
              min={0}
              step={0.1}
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              required
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="card">
        <legend className="card__legend">먹고 있는 영양제</legend>
        <p className="card__hint">최소 1개, 최대 20개까지 입력할 수 있습니다.</p>

        {supplements.map((item, index) => (
          <div className="row" key={index}>
            <div className="row__head">
              <span className="row__index">영양제 {index + 1}</span>
              <button
                type="button"
                className="btn-remove"
                onClick={() => removeSupplement(index)}
                disabled={supplements.length <= 1}
                aria-label={`영양제 ${index + 1} 삭제`}
              >
                삭제
              </button>
            </div>

            <div className="field-grid">
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="field__label" htmlFor={`supplement-supplementName-${index}`}>
                  영양제 이름
                </label>
                <input
                  id={`supplement-supplementName-${index}`}
                  placeholder="예: 비타민 D 1000IU"
                  value={item.supplementName}
                  onChange={(e) => updateSupplement(index, { supplementName: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor={`supplement-nutrient-${index}`}>
                  함유 영양소 (선택)
                </label>
                <input
                  id={`supplement-nutrient-${index}`}
                  placeholder="예: 비타민 D"
                  value={item.nutrient ?? ""}
                  onChange={(e) => updateSupplement(index, { nutrient: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor={`supplement-doseAmount-${index}`}>
                  1회 섭취량
                </label>
                <input
                  id={`supplement-doseAmount-${index}`}
                  type="number"
                  min={0.01}
                  step={0.01}
                  required
                  value={item.doseAmount}
                  onChange={(e) => updateSupplement(index, { doseAmount: Number(e.target.value) })}
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor={`supplement-doseUnit-${index}`}>
                  단위
                </label>
                <select
                  id={`supplement-doseUnit-${index}`}
                  value={item.doseUnit}
                  onChange={(e) => updateSupplement(index, { doseUnit: e.target.value as DoseUnit })}
                >
                  {DOSE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {DOSE_UNIT_LABEL[unit]}
                    </option>
                  ))}
                </select>
                {CFU_UNITS.includes(item.doseUnit) && (
                  <p className="field__hint">
                    유산균은 무게보다 균 수가 기준입니다. 제품에 “100억 CFU” 로 적혀 있으면 100 + 억 CFU
                    로 입력하세요. (1포 ≈ 1.5g, 1캡슐 ≈ 400~500mg 은 대부분 부형제입니다)
                  </p>
                )}
              </div>

              <div className="field">
                <label className="field__label" htmlFor={`supplement-doseFrequency-${index}`}>
                  1일 횟수
                </label>
                <input
                  id={`supplement-doseFrequency-${index}`}
                  type="number"
                  min={1}
                  value={item.doseFrequency}
                  onChange={(e) =>
                    updateSupplement(index, { doseFrequency: Number(e.target.value) })
                  }
                />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <span className="field__label">섭취 시각 ({item.doseFrequency}회)</span>
                <div className="time-grid">
                  {item.intakeTimes.map((slot, slotIndex) => (
                    <div className="field" key={slotIndex}>
                      <label
                        className="field__sublabel"
                        htmlFor={`supplement-intakeTimes-${index}-${slotIndex}`}
                      >
                        {slotIndex + 1}회차
                      </label>
                      <select
                        id={`supplement-intakeTimes-${index}-${slotIndex}`}
                        value={slot}
                        onChange={(e) =>
                          updateIntakeTime(index, slotIndex, e.target.value as TimeSlot)
                        }
                      >
                        {TIME_SLOTS.map((value) => (
                          <option key={value} value={value}>
                            {TIME_SLOT_LABEL[value]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn-add"
          onClick={() => setSupplements((prev) => [...prev, createSupplement()])}
          disabled={supplements.length >= 20}
        >
          + 영양제 추가
        </button>
      </fieldset>

      <fieldset className="card">
        <legend className="card__legend">복용 중인 약 (선택)</legend>
        <p className="card__hint">
          약을 적어주면 그 약과 부딪히는 영양제가 있는지 함께 확인합니다. 없으면 비워두세요.
        </p>

        {medications.map((med, index) => (
          <div className="row" key={index}>
            <div className="row__head">
              <span className="row__index">약 {index + 1}</span>
              <button
                type="button"
                className="btn-remove"
                onClick={() => setMedications((prev) => prev.filter((_, i) => i !== index))}
                aria-label={`약 ${index + 1} 삭제`}
              >
                삭제
              </button>
            </div>

            <div className="field-grid">
              <div className="field">
                <label className="field__label" htmlFor={`medication-medicationName-${index}`}>
                  약 이름
                </label>
                <input
                  id={`medication-medicationName-${index}`}
                  placeholder="예: 와파린"
                  value={med.medicationName}
                  onChange={(e) => updateMedication(index, { medicationName: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor={`medication-ingredient-${index}`}>
                  성분 (선택)
                </label>
                <input
                  id={`medication-ingredient-${index}`}
                  placeholder="예: 와파린나트륨"
                  value={med.ingredient ?? ""}
                  onChange={(e) => updateMedication(index, { ingredient: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn-add"
          onClick={() => setMedications((prev) => [...prev, { medicationName: "", intakeTimes: [] }])}
        >
          + 약 추가
        </button>
      </fieldset>

      <button type="submit" className="btn-submit" disabled={isLoading}>
        {isLoading ? "분석 중..." : "분석하기"}
      </button>
    </form>
  );
}

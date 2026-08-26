/**
 * 3단계로 나눠 입력받는다: 내 정보 -> 영양제 -> 복용 약 -> 분석.
 *
 * 한 화면에 다 밀어넣지 않고 단계로 끊는 이유는 입력 항목이 많아서다.
 * 각 단계는 다음으로 넘어갈 때 검증한다. 마지막 단계에서만 제출된다.
 */

import { useState, type FormEvent } from "react";
import { StepIndicator } from "@/components/StepIndicator";
import { DOSE_UNITS, TIME_SLOT_LABEL } from "@/constants/labels";
import type {
  AnalysisRequest,
  DoseUnit,
  Medication,
  Sex,
  Supplement,
  TimeSlot,
} from "@/types/analysis";

const STEPS = ["내 정보", "영양제", "복용 약"];
const LAST_STEP = STEPS.length - 1;

/** 행마다 새 객체를 만든다. 같은 참조를 여러 행이 공유하지 않도록. */
const createSupplement = (): Supplement => ({
  supplementName: "",
  doseAmount: 1,
  doseUnit: "mg",
  doseFrequency: 1,
  intakeTime: "after_meal",
});

interface Props {
  isLoading: boolean;
  onSubmit: (request: AnalysisRequest) => void;
}

export function SupplementForm({ isLoading, onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<Sex>("female");
  const [weightKg, setWeightKg] = useState(60);
  const [supplements, setSupplements] = useState<Supplement[]>([createSupplement()]);
  const [medications, setMedications] = useState<Medication[]>([]);

  const updateSupplement = (index: number, patch: Partial<Supplement>) => {
    setSupplements((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeSupplement = (index: number) => {
    // supplements 는 1개 이상이어야 한다 (docs/API.md).
    setSupplements((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const updateMedication = (index: number, patch: Partial<Medication>) => {
    setMedications((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  /** 통과하면 null, 막히면 사용자에게 보여줄 문구를 돌려준다. */
  const validateStep = (index: number): string | null => {
    if (index === 0) {
      if (!Number.isFinite(age) || age < 0 || age > 120)
        return "나이를 0~120 사이로 입력해 주세요.";
      if (!Number.isFinite(weightKg) || weightKg <= 0) return "체중을 입력해 주세요.";
      return null;
    }
    if (index === 1) {
      const blank = supplements.findIndex((item) => item.supplementName.trim() === "");
      if (blank >= 0) return `영양제 ${blank + 1}의 이름을 입력해 주세요.`;
      const badDose = supplements.findIndex((item) => !(item.doseAmount > 0));
      if (badDose >= 0) return `영양제 ${badDose + 1}의 1회 섭취량을 0보다 크게 입력해 주세요.`;
      return null;
    }
    return null;
  };

  const goNext = () => {
    const message = validateStep(step);
    if (message) {
      setStepError(message);
      return;
    }
    setStepError(null);
    setStep((prev) => Math.min(prev + 1, LAST_STEP));
  };

  const goPrev = () => {
    setStepError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // 마지막 단계가 아니면 Enter 를 눌러도 제출하지 않고 다음으로 넘어간다.
    if (step !== LAST_STEP) {
      goNext();
      return;
    }
    for (let i = 0; i <= LAST_STEP; i += 1) {
      const message = validateStep(i);
      if (message) {
        setStep(i);
        setStepError(message);
        return;
      }
    }
    onSubmit({
      userProfile: { age, sex, weightKg },
      supplements,
      // 빈 이름은 보내지 않는다.
      medications: medications.filter((med) => med.medicationName.trim() !== ""),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <StepIndicator
        steps={STEPS}
        current={step}
        onGoTo={(index) => {
          setStepError(null);
          setStep(index);
        }}
      />

      {step === 0 && (
        <fieldset className="card">
          <legend className="card__legend">내 정보</legend>
          <p className="card__hint">나이·성별·체중에 따라 권장 섭취량이 달라집니다.</p>
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
              <select id="profile-sex" value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
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
      )}

      {step === 1 && (
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
                <div className="field field--wide">
                  <label className="field__label" htmlFor={`supplement-supplementName-${index}`}>
                    영양제 이름
                  </label>
                  <input
                    id={`supplement-supplementName-${index}`}
                    placeholder="예: 비타민 D 1000IU"
                    value={item.supplementName}
                    onChange={(e) =>
                      updateSupplement(index, {
                        supplementName: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      updateSupplement(index, {
                        doseAmount: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label className="field__label" htmlFor={`supplement-doseUnit-${index}`}>
                    단위
                  </label>
                  <select
                    id={`supplement-doseUnit-${index}`}
                    value={item.doseUnit}
                    onChange={(e) =>
                      updateSupplement(index, {
                        doseUnit: e.target.value as DoseUnit,
                      })
                    }
                  >
                    {DOSE_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
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
                      updateSupplement(index, {
                        doseFrequency: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label className="field__label" htmlFor={`supplement-intakeTime-${index}`}>
                    섭취 시각
                  </label>
                  <select
                    id={`supplement-intakeTime-${index}`}
                    value={item.intakeTime}
                    onChange={(e) =>
                      updateSupplement(index, {
                        intakeTime: e.target.value as TimeSlot,
                      })
                    }
                  >
                    {Object.entries(TIME_SLOT_LABEL).map(([slot, label]) => (
                      <option key={slot} value={slot}>
                        {label}
                      </option>
                    ))}
                  </select>
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
      )}

      {step === 2 && (
        <fieldset className="card">
          <legend className="card__legend">복용 중인 약 (선택)</legend>
          <p className="card__hint">
            약을 적어주면 그 약과 부딪히는 영양제가 있는지 함께 확인합니다. 없으면 비워두고 바로
            분석하셔도 됩니다.
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
                    onChange={(e) =>
                      updateMedication(index, {
                        medicationName: e.target.value,
                      })
                    }
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
            onClick={() => setMedications((prev) => [...prev, { medicationName: "" }])}
          >
            + 약 추가
          </button>
        </fieldset>
      )}

      {stepError && (
        <p className="alert" role="alert">
          {stepError}
        </p>
      )}

      <div className="wizard-nav">
        {step > 0 && (
          <button type="button" className="btn-ghost" onClick={goPrev} disabled={isLoading}>
            이전
          </button>
        )}
        {step < LAST_STEP ? (
          <button type="button" className="btn-submit" onClick={goNext}>
            다음
          </button>
        ) : (
          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? "분석 중..." : "분석하기"}
          </button>
        )}
      </div>
    </form>
  );
}

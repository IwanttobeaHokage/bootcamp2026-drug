#!/usr/bin/env python3
"""용어 규칙 검사기.

docs/GLOSSARY.md 의 금지어가 코드에 들어왔는지, 파일이 정해진 곳에 있는지 검사한다.
CI 에서 자동으로 돌고, 걸리면 빌드가 실패한다.

로컬에서 미리 확인:  python scripts/check_glossary.py

특정 줄만 예외로 두려면 그 줄 끝에 glossary-ok 주석을 단다.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# 검사할 곳. 여기 없는 폴더는 보지 않는다(문서에는 금지어가 예시로 들어있으므로).
SCAN_DIRS = ["backend/app", "backend/tests", "frontend/src", "infra/llm"]
SCAN_SUFFIXES = {".py", ".ts", ".tsx", ".js", ".jsx"}

ESCAPE_HATCH = "glossary-ok"

# (정규식, 올바른 용어, 설명)
BANNED = [
    (r"\bgender\b", "sex", "GLOSSARY 3-1"),
    (r"\bdosage\b", "dose_amount / doseAmount", "GLOSSARY 3-1"),
    (r"\bweight\b", "weight_kg / weightKg", "단위를 이름에 포함한다"),
    (r"\bcombo\b|\bcombination\b", "nutrient_stack / nutrientStack", "GLOSSARY 3-2"),
    (r"\bmedicine\b|\bpill\b", "medication(약) 또는 supplement(영양제)", "둘은 다른 개념"),
    (r"(?<!bootcamp2026-)\bdrug\b", "medication", "GLOSSARY 7"),
    # logger.warning 처럼 점 뒤에 오는 표준 API 호출은 금지어가 아니다.
    (r"(?<!\.)\bwarning\b", "caution / riskLevel", "GLOSSARY 3-2"),
    # 섭취 시각은 1일 횟수만큼 배열로 받는다. 단수형과 옛 필드는 쓰지 않는다.
    (r"\bintake_time\b|\bintakeTime\b", "intake_times / intakeTimes", "GLOSSARY 3-1"),
    (r"\bintake_timing\b|\bintakeTiming\b", "time_slot / timeSlot", "GLOSSARY 3-2"),
]

# 코드가 있어도 되는 곳. 이 밖에 소스 파일이 있으면 잘못 놓인 것이다.
# infra/ 는 배포 대상(IaC + Bedrock Lambda)만 둔다. 우리 서비스 로직은 여기 두지 않는다.
ALLOWED_CODE_PREFIXES = ("backend/", "frontend/", "scripts/", "infra/")


def iter_source_files():
    for rel_dir in SCAN_DIRS:
        base = ROOT / rel_dir
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.is_file() and path.suffix in SCAN_SUFFIXES:
                yield path


def check_banned_words() -> list[str]:
    problems: list[str] = []
    for path in iter_source_files():
        rel = path.relative_to(ROOT).as_posix()
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            continue

        for lineno, line in enumerate(lines, start=1):
            if ESCAPE_HATCH in line:
                continue
            for pattern, correct, note in BANNED:
                match = re.search(pattern, line, flags=re.IGNORECASE)
                if match:
                    problems.append(
                        f"{rel}:{lineno}\n"
                        f"    금지어 '{match.group(0)}' 를 찾았습니다.\n"
                        f"    -> '{correct}' 를 쓰세요. ({note})\n"
                        f"    {line.strip()[:100]}"
                    )
    return problems


def check_file_locations() -> list[str]:
    problems: list[str] = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in SCAN_SUFFIXES:
            continue
        rel = path.relative_to(ROOT).as_posix()
        if any(part in {"node_modules", ".venv", "dist", "__pycache__", ".git"} for part in path.parts):
            continue
        if not rel.startswith(ALLOWED_CODE_PREFIXES):
            problems.append(
                f"{rel}\n"
                f"    소스 파일이 잘못된 위치에 있습니다.\n"
                f"    -> 프론트엔드는 frontend/src/, 백엔드는 backend/app/ 아래에 두세요."
            )
    return problems


def main() -> int:
    problems = check_banned_words() + check_file_locations()

    if not problems:
        print("용어 검사 통과. 금지어 없음, 파일 위치 정상.")
        return 0

    print("=" * 70)
    print(f"용어 규칙 위반 {len(problems)}건")
    print("=" * 70)
    for problem in problems:
        print()
        print(problem)
    print()
    print("-" * 70)
    print("docs/GLOSSARY.md 에서 표준 용어를 확인하세요.")
    print("사전에 없는 새 개념이라면, 코드보다 GLOSSARY 를 먼저 고치는 PR 을 올리세요.")
    print("정말 예외가 필요하면 해당 줄 끝에 glossary-ok 주석을 답니다.")
    return 1


if __name__ == "__main__":
    sys.exit(main())

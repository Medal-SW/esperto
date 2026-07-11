import csv
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.letroso.models import LetrosoWord
from app.letroso.utils import normalize_word

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "letroso"
SECRET_FREQ_THRESHOLD = 1.0
MIN_LENGTH = 4
MAX_LENGTH = 10


def _load_pt_br_set() -> set[str]:
    lexico_path = DATA_DIR / "pt-br-words.txt"
    pt_br_set: set[str] = set()
    if lexico_path.exists():
        with open(lexico_path, encoding="utf-8") as f:
            for line in f:
                raw = line.strip()
                if raw:
                    pt_br_set.add(normalize_word(raw))
    return pt_br_set


def load_dictionary(db: Session) -> None:
    count = db.query(LetrosoWord).count()
    if count > 0:
        print(f"Letroso dictionary already loaded ({count} words) — skipping.")
        return

    _do_load(db)


def reload_dictionary(db: Session) -> None:
    db.execute(text("TRUNCATE letroso_words RESTART IDENTITY CASCADE"))
    db.commit()
    print("Letroso dictionary truncated.")
    _do_load(db)


def _do_load(db: Session) -> None:
    pt_br_set = _load_pt_br_set()
    words_to_insert: dict[str, LetrosoWord] = {}

    for n in range(MIN_LENGTH, MAX_LENGTH + 1):
        csv_path = DATA_DIR / f"words{n}.csv"
        if not csv_path.exists():
            print(f"Warning: {csv_path} not found, skipping.")
            continue

        with open(csv_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_word = row["word"].strip()
                normalized = normalize_word(raw_word)

                if not normalized.isalpha():
                    continue
                if not (MIN_LENGTH <= len(normalized) <= MAX_LENGTH):
                    continue
                if normalized in words_to_insert:
                    continue

                freq = float(row["Freq"])
                is_secret = freq > SECRET_FREQ_THRESHOLD and normalized in pt_br_set

                words_to_insert[normalized] = LetrosoWord(
                    word=normalized,
                    word_length=len(normalized),
                    is_secret=is_secret,
                )

    verbete_count = len(words_to_insert)
    secret_count = sum(1 for w in words_to_insert.values() if w.is_secret)

    lexico_added = 0
    for normalized_word in pt_br_set:
        if not normalized_word.isalpha():
            continue
        if not (MIN_LENGTH <= len(normalized_word) <= MAX_LENGTH):
            continue
        if normalized_word in words_to_insert:
            continue

        words_to_insert[normalized_word] = LetrosoWord(
            word=normalized_word,
            word_length=len(normalized_word),
            is_secret=False,
        )
        lexico_added += 1

    db.add_all(words_to_insert.values())
    db.commit()

    total = len(words_to_insert)
    print(
        f"Letroso dictionary loaded: {total} words "
        f"({secret_count} secret from verbete, "
        f"{verbete_count - secret_count} validation from verbete, "
        f"{lexico_added} extra from lexico)."
    )

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


def load_dictionary(db: Session) -> None:
    count = db.query(LetrosoWord).count()
    if count > 0:
        print(f"Letroso dictionary already loaded ({count} words) — skipping.")
        return

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
                is_secret = freq > SECRET_FREQ_THRESHOLD

                words_to_insert[normalized] = LetrosoWord(
                    word=normalized,
                    word_length=len(normalized),
                    is_secret=is_secret,
                )

    verbete_count = len(words_to_insert)
    secret_count = sum(1 for w in words_to_insert.values() if w.is_secret)

    lexico_path = DATA_DIR / "pt-br-words.txt"
    lexico_added = 0
    if lexico_path.exists():
        with open(lexico_path, encoding="utf-8") as f:
            for line in f:
                raw_word = line.strip()
                if not raw_word:
                    continue
                normalized = normalize_word(raw_word)

                if not normalized.isalpha():
                    continue
                if not (MIN_LENGTH <= len(normalized) <= MAX_LENGTH):
                    continue
                if normalized in words_to_insert:
                    continue

                words_to_insert[normalized] = LetrosoWord(
                    word=normalized,
                    word_length=len(normalized),
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

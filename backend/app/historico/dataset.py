import csv
from pathlib import Path

from sqlalchemy.orm import Session

from app.historico.models import HistoricoEvent

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "historico"


def load_events(db: Session) -> None:
    count = db.query(HistoricoEvent).count()
    if count > 0:
        print(f"Historico events already loaded ({count}) — skipping.")
        return

    csv_path = DATA_DIR / "eventos.csv"
    if not csv_path.exists():
        print(f"Historico dataset not found at {csv_path} — skipping.")
        return

    seen: set[str] = set()
    events: list[HistoricoEvent] = []
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=";")
        for row in reader:
            if not row or row[0].startswith("#") or row[0] == "nome":
                continue
            name = row[0].strip()
            if not name or name in seen:
                continue
            seen.add(name)
            events.append(HistoricoEvent(
                name=name,
                year=int(row[1]),
                category=row[2].strip() if len(row) > 2 and row[2].strip() else None,
            ))

    db.add_all(events)
    db.commit()
    print(f"Historico dataset loaded: {len(events)} events.")

import unicodedata


def normalize_word(word: str) -> str:
    nfkd = unicodedata.normalize("NFKD", word.lower())
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def compute_feedback(guess_normalized: str, secret_normalized: str) -> list[dict]:
    n_secret = len(secret_normalized)

    matched: dict[int, int] = {}
    secret_j = 0
    for gi, gc in enumerate(guess_normalized):
        saved_j = secret_j
        found = False
        while secret_j < n_secret:
            if gc == secret_normalized[secret_j]:
                matched[gi] = secret_j
                secret_j += 1
                found = True
                break
            secret_j += 1
        if not found:
            secret_j = saved_j

    remaining = list(secret_normalized)
    for sp in matched.values():
        remaining[sp] = None

    result = []
    for gi, gc in enumerate(guess_normalized):
        if gi in matched:
            sp = matched[gi]
            result.append({
                "letter": gc,
                "state": "correct",
                "position": gi,
                "edge_start": sp == 0,
                "edge_end": sp == n_secret - 1,
            })
        elif gc in remaining:
            remaining[remaining.index(gc)] = None
            result.append({
                "letter": gc,
                "state": "present",
                "position": gi,
                "edge_start": False,
                "edge_end": False,
            })
        else:
            result.append({
                "letter": gc,
                "state": "absent",
                "position": gi,
                "edge_start": False,
                "edge_end": False,
            })

    return result

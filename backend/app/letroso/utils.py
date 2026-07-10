import unicodedata


def normalize_word(word: str) -> str:
    nfkd = unicodedata.normalize("NFKD", word.lower())
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def compute_feedback(guess_normalized: str, secret_normalized: str) -> list[dict]:
    n = len(secret_normalized)
    result = [
        {"letter": guess_normalized[i], "state": "absent", "position": i}
        for i in range(n)
    ]

    secret_remaining = list(secret_normalized)

    for i in range(n):
        if guess_normalized[i] == secret_normalized[i]:
            result[i]["state"] = "correct"
            secret_remaining[i] = None

    for i in range(n):
        if result[i]["state"] == "correct":
            continue
        letter = guess_normalized[i]
        if letter in secret_remaining:
            result[i]["state"] = "present"
            secret_remaining[secret_remaining.index(letter)] = None

    return result

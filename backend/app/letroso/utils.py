import unicodedata
from difflib import SequenceMatcher


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
            result.append(
                {
                    "letter": gc,
                    "state": "correct",
                    "position": gi,
                }
            )
        elif gc in remaining:
            remaining[remaining.index(gc)] = None
            result.append(
                {
                    "letter": gc,
                    "state": "present",
                    "position": gi,
                }
            )
        else:
            result.append(
                {
                    "letter": gc,
                    "state": "absent",
                    "position": gi,
                }
            )

    return result


def evaluate_guess(guess: str, target: str) -> list[dict]:
    matcher = SequenceMatcher(None, target, guess)
    blocks = [b for b in matcher.get_matching_blocks() if b.size > 0]

    matched_target_indices = {b.a + k for b in blocks for k in range(b.size)}
    unused_target = [
        char for i, char in enumerate(target) if i not in matched_target_indices
    ]

    result = []
    guess_idx = 0

    for block in blocks:
        while guess_idx < block.b:
            char = guess[guess_idx]
            exists = char in unused_target
            if exists:
                unused_target.remove(char)

            result.append(
                {
                    "substring": char,
                    "exists": exists,
                    "correct_order": False,
                    "is_start": False,
                    "is_end": False,
                }
            )
            guess_idx += 1

        result.append(
            {
                "substring": guess[block.b : block.b + block.size],
                "exists": True,
                "correct_order": True,
                "is_start": (block.b == 0 and guess[0] == target[0]),
                "is_end": (
                    block.b + block.size == len(guess) and guess[-1] == target[-1]
                ),
            }
        )
        guess_idx += block.size

    while guess_idx < len(guess):
        char = guess[guess_idx]
        exists = char in unused_target
        if exists:
            unused_target.remove(char)

        result.append(
            {
                "substring": char,
                "exists": exists,
                "correct_order": False,
                "is_start": False,
                "is_end": False,
            }
        )
        guess_idx += 1

    return result

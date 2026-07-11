def era_for_year(year: int) -> str:
    if year <= 476:
        return "antiga"
    if year <= 1452:
        return "media"
    if year <= 1788:
        return "moderna"
    if year <= 1945:
        return "contemporanea"
    return "atual"

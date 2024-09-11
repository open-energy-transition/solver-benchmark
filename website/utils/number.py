def round_number(value: float, decimal_places: int = 1) -> float:
    """
    Rounds the given value to the specified number of decimal places.

    Args:
        value (float): The number to round.
        decimal_places (int): The number of decimal places to round to. Default is 1.

    Returns:
        float: The rounded number.
    """
    return round(value, decimal_places)

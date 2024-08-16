def parse_time(time_str):
    try:
        # Split the time string by the colon
        parts = time_str.split(':')

        if len(parts) == 3:  # h:mm:ss format
            hours = int(parts[0])
            minutes = int(parts[1])
            seconds = float(parts[2])
            return hours * 3600 + minutes * 60 + seconds

        elif len(parts) == 2:  # m:ss format
            minutes = int(parts[0])
            seconds = float(parts[1])
            return minutes * 60 + seconds

        elif len(parts) == 1:  # If there's no colon, assume the format is just seconds
            return float(parts[0])

        else:
            raise ValueError("Invalid time format")

    except ValueError as e:
        print(f"Error parsing time: {e}")
        return None

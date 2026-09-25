def analyze_mps_correctly(file_path):
    """
    This script analyzes a .mps file to extract:
    - Number of constraints
    - Total number of variables
    - Number of integer variables (binary excluded)
    - Number of binary variables
    - Number of continuous variables
    """
    try:
        with open(file_path, "r") as file:
            lines = file.readlines()

        constraints_count = 0  # Number of constraints (rows)
        total_variables = set()  # Total number of variables (COLUMNS)
        integer_variables = set()  # Number of integer variables (binary excluded)
        binary_variables = set()  # Number of binary variables
        all_integer_variables = (
            set()
        )  # Number of continuous variables (including integer and binary variables)

        in_rows = False
        in_columns = False
        in_bounds = False

        for line in lines:
            # Identify the different sections of the .mps file
            if line.startswith("ROWS"):
                in_rows = True
                in_columns = False
                in_bounds = False
            elif line.startswith("COLUMNS"):
                in_rows = False
                in_columns = True
                in_bounds = False
            elif line.startswith("BOUNDS"):
                in_rows = False
                in_columns = False
                in_bounds = True
            elif line.startswith("ENDATA"):
                in_rows = False
                in_columns = False
                in_bounds = False

            # Count constraints
            if in_rows and (
                line.startswith(" L") or line.startswith(" G") or line.startswith(" E")
            ):
                constraints_count += 1

            # Record variables in the COLUMNS section
            if in_columns and len(line.strip()) > 0:
                tokens = line.split()
                if len(tokens) > 1:
                    total_variables.add(
                        tokens[1]
                    )  # Aggiungi la variabile (senza duplicati)

            # Identify integer and binary variables in the BOUNDS section
            if in_bounds:
                tokens = line.split()
                if len(tokens) > 2:
                    var_name = tokens[2]
                    if "BV" in line:  # Binary variables
                        binary_variables.add(var_name)
                        all_integer_variables.add(
                            var_name
                        )  # Binary variables are also integer variables
                    elif "LI" in line or "UI" in line:  # Identify integer variables
                        integer_variables.add(var_name)
                        all_integer_variables.add(var_name)

        # Avoid double counting
        continuous_variables = total_variables - all_integer_variables

        return {
            "constraints_count": constraints_count,  # Number of constraints
            "total_variables": len(total_variables),  # Total number of variables
            "integer_variables": len(
                integer_variables
            ),  # Integer variables only (binary excluded)
            "binary_variables": len(binary_variables),  # Binary variables only
            "continuous_variables": len(continuous_variables),  # Continuous variables
        }
    except Exception as e:
        return {"error": str(e)}


# Analyze the .mps file
file_path = "tmp.mps"
results = analyze_mps_correctly(file_path)
print(results)

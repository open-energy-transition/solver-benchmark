import highspy
from pathlib import Path

def get_model_stats(file_path):
    file_path = Path(file_path).resolve()
    
    highs = highspy.Highs()
    try:
        highs.readModel(str(file_path))
        num_vars = highs.numVariables
        num_constraints = highs.numConstrs

        result = {
            "constraints_count": num_constraints,
            "total_variables": num_vars,
            "integer_variables": None,
            "binary_variables": None,
            "continuous_variables": None,
        }

        # Add extra breakdown only for MPS
        if file_path.suffix.lower() == ".mps":
            result.update(analyze_mps_correctly(file_path))

        return result

    except RuntimeError as e:
        print(f"Error reading model: {e}")
        return {"error": str(e)}


# Example usage
stats = get_model_stats('/home/user/Documents/OET_repos/RA_outputs/RA_DCOPF_2021_TE_10x_LP_M.lp')
print(stats)
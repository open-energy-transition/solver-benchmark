import matplotlib.pyplot as plt

def create_comparison_chart(solver1_data, solver2_data, solver1, solver2):
    fig, ax = plt.subplots(figsize=(8, 8))
    
    # Scatter plot with different colors
    ax.scatter(solver1_data["Runtime (s)"], solver2_data["Runtime (s)"], color='blue', label=solver1)
    ax.scatter(solver2_data["Runtime (s)"], solver1_data["Runtime (s)"], color='red', label=solver2)
    
    # Adding grid lines
    ax.grid(True, which='both', linestyle='--', linewidth=0.5)
    
    # Adding labels and title
    ax.set_xlabel(f"{solver1} Runtime (s)")
    ax.set_ylabel(f"{solver2} Runtime (s)")
    ax.set_title(f"Comparison of {solver1} and {solver2} Runtimes")
    
    # Adding legend
    ax.legend()
    
    return fig
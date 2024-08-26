import matplotlib.pyplot as plt
import numpy as np


def create_comparison_chart(solver1_data, solver2_data, solver1, solver2):
    fig, ax = plt.subplots(2, 1, figsize=(8, 8))

    # Scatter plot with different colors
    ax[0].scatter(solver1_data["Runtime (s)"], solver2_data["Runtime (s)"], color='blue', label='data point per benchmark')
    # ax.scatter(solver2_data["Runtime (s)"], solver1_data["Runtime (s)"], color='red', label=solver2)

    # Adding grid lines
    ax[0].grid(True, which='both', linestyle='--', linewidth=0.5)

    # Adding labels and title
    ax[0].set_xlabel(f"{solver1} Runtime (s)")
    ax[0].set_ylabel(f"{solver2} Runtime (s)")
    ax[0].set_title(f"Comparison of {solver1} and {solver2} Runtimes")

    # Adding legend
    ax[0].legend()

    # Second subplot: Bar chart showing the runtime differences
    indices = np.arange(len(solver1_data))
    bar_width = 0.35

    ax[1].bar(indices, solver1_data["Runtime (s)"], bar_width, label=f'{solver1} Runtime (s)')
    ax[1].bar(indices + bar_width, solver2_data["Runtime (s)"], bar_width, label=f'{solver2} Runtime (s)')

    # Adding grid lines, labels, and title to the second subplot
    ax[1].grid(True, which='both', linestyle='--', linewidth=0.5)
    ax[1].set_xlabel("Benchmark Index")
    ax[1].set_ylabel("Runtime (s)")
    ax[1].set_title(f"Runtime Comparison of {solver1} and {solver2} (Bar Chart)")
    ax[1].legend()

    # Adjust layout to avoid overlap
    plt.tight_layout()
    
    # Increase space between the subplots
    plt.subplots_adjust(hspace=0.4)  # Adjust the value as needed

    return fig

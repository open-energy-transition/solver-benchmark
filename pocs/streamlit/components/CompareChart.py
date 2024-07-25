import matplotlib.pyplot as plt

def create_comparison_chart(solver1_data, solver2_data, solver1, solver2):
    fig, ax = plt.subplots(figsize=(8, 8))
    ax.scatter(solver1_data["Runtime (mean)"], solver2_data["Runtime (mean)"])
    ax.set_xlabel(f"{solver1} Runtime (mean)")
    ax.set_ylabel(f"{solver2} Runtime (mean)")
    ax.set_title(f"Comparison of {solver1} and {solver2} Runtimes")
    return fig
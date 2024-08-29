import streamlit as st
import plotly.graph_objects as go
import pandas as pd

data = pd.read_csv('./pocs/benchmark_results.csv')

st.title("Solver Performance History")

# Find the peak memory usage and average runtime for each solver and benchmark
peak_memory = data.groupby(['Benchmark', 'Solver'])['Memory Usage (MB)'].max().reset_index()
average_runtime = data.groupby(['Benchmark', 'Solver'])['Runtime (s)'].mean().reset_index()

# Runtimes
fig_runtime = go.Figure()

# Add lines
for benchmark in average_runtime['Benchmark'].unique():
    subset = average_runtime[average_runtime['Benchmark'] == benchmark]
    fig_runtime.add_trace(go.Scatter(
        x=subset['Solver'],
        y=subset['Runtime (s)'],
        mode='lines+markers',
        name=f'{benchmark}'
    ))

fig_runtime.update_layout(
    title='Solver Runtime Comparison',
    xaxis_title='Solver Version',
    yaxis_title='Runtime (s)',
    template='plotly_dark'
)

# Memory usage
fig_memory = go.Figure()

for benchmark in peak_memory['Benchmark'].unique():
    subset = peak_memory[peak_memory['Benchmark'] == benchmark]
    fig_memory.add_trace(go.Scatter(
        x=subset['Solver'],
        y=subset['Memory Usage (MB)'],
        mode='lines+markers',
        name=f'{benchmark}'
    ))

fig_memory.update_layout(
    title='Solver Peak Memory Consumption',
    xaxis_title='Solver Version',
    yaxis_title='Memory Usage (MB)',
    template='plotly_dark'
)

st.plotly_chart(fig_runtime)
st.plotly_chart(fig_memory)

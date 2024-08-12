# Measure Benchmark Runtime and Memory Consumption

## Run Project

1. **Create Virtual Environment**
   ```shell
   python -m venv venv
   ```

2. **Activate Virtual Environment**
   - **Windows**
     ```shell
     .\venv\Scripts\activate
     ```
   - **Linux/MacOS**
     ```shell
     source venv/bin/activate
     ```

3. **Install Dependencies**
   ```shell
   pip install -r requirements.txt
   ```

4. **Run Project**
   ```shell
   python pocs/runner/app.py
   ```

## Comparing Memory Usage: PyPSA Benchmark's memory_logger vs. tracemalloc.get_traced_memory
```
   # Measure memory usage by tracemalloc
   tracemalloc.start()
   m.solve(solver_name=solver_name)  # Run again for memory measurement
   current, peak = tracemalloc.get_traced_memory()
   tracemalloc.stop()
   # Record memory usage
   memory_usages.append(peak / 10**6)  # Convert to MB

   # Measure memory usage by tracemalloc memory_logger
   with memory_logger(max_usage=True) as mem:
      m.solve(solver_name=solver_name)  # Solve the model to measure memory
   max_mem, timestamp = mem.mem_usage
   max_mem_usages.append(max_mem)
```

1. **Run Test**
   ```shell
   python pocs/runner/_test.py
   ```

The result in **benchmark.csv** file
```
Benchmark,Solver,Runtime (s),Tracemalloc test Memory Usage (MB),PyPSA _benchmark test Memory Usage (MB)
model-energy-electricity.nc,highs,15.197204351425171,23.772888,617.71875
model-energy-electricity.nc,highs,14.601204872131348,23.746189,751.453125
model-energy-electricity.nc,highs,14.47638201713562,23.741457,958.03125
```

The app will save the runtime and memory consumption into a CSV file.
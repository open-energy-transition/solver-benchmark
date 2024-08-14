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
   python pocs/measure-memory/pypsa_test.py
   ```

The result in **benchmark.csv** file
```
Benchmark,Solver,Runtime (s),Tracemalloc test Memory Usage (MB),PyPSA run_benchmarks test Memory Usage (MB)
model-energy-electricity.nc,highs,15.197204351425171,23.772888,617.71875
model-energy-electricity.nc,highs,14.601204872131348,23.746189,751.453125
model-energy-electricity.nc,highs,14.47638201713562,23.741457,958.03125
```

## Use the linopy memory test benchmark model to check that the reported memory increases with model size
1. **Run Test**
   ```shell
   python pocs/measure-memory/linopy_memory_test.py
   ```

The result in **benchmark_linopy_memory_test_results.csv** file


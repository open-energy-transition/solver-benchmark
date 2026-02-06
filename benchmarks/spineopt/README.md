# Numerical Issues and Solver Options

This directory contains benchmarks that highlight numerical issues encountered when solving optimization problems using the SpineOpt framework. These issues often arise due to scaling problems due to the wide range of magnitudes in the data used for modeling energy systems, i.e., operational cost and investment cost over multiple time periods, and different units across sectors.

To address these numerical challenges, specific solver options and configurations should be considered when benchmarking. For instance, when using HiGHS consider the `user_objective_scale` option value of -7 and `user_bound_scale` option value of -12, for the case study named `12rp-per-year` in this folder. Commercial solvers have automatic scaling rutines that normally handle these issues better, but it is still recommended to experiment with different scaling options.

Finally, when running this files, for both open-source and commercial solvers, it is recommended to disable the `crossover`, given the complexity of the problems.

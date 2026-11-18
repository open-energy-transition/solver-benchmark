# SpineOpt problems: numerical issues and solver options

This folder contains problems that show numerical issues encountered when solving optimization problems using the SpineOpt framework. These issues come from poor scaling, due to the wide range of magnitudes in the data used for modeling energy systems, e.g. operational and and investment cost over multiple time periods, and different units across sectors.

Solver options can help. For example, for the `12rp-per-year` case with HiGHS, try `user_objective_scale` = -7 and `user_bound_scale` = -12. Commercial solvers have automatic scaling routines that usually handle these issues better, but other scaling options are still worth trying.

Given the complexity of the problems, we recommend turning crossover off, with both open-source and commercial solvers.

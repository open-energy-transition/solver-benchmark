# SpineOpt problems: numerical issues and solver options

The SpineOpt problems of this folder are hard to solve because of poor scaling: their data span a wide range of magnitudes, such as operational and investment costs over several periods, in different units across sectors.

Solver options can help. For example, for the `12rp-per-year` case with HiGHS, try `user_objective_scale` = -7 and `user_bound_scale` = -12. Commercial solvers have automatic scaling routines that usually handle these issues better, but other scaling options are still worth trying.

Given the complexity of the problems, we recommend turning crossover off, with both open-source and commercial solvers.

<!-- Title: the area it changes and a short description in the active voice, e.g. `Benchmarks: add TIMES instances` or `Website: fix scrollbar on performance history page` (see CONTRIBUTING.md). -->

<!-- What the change does and why, and how you tested it. Say which AI tools you used, if any, and for what. -->

Fixes # <!-- the issue it closes, if any; otherwise delete this line -->

<!-- Delete the sections that don't apply to this pull request. -->

### New benchmark problems

In the metadata of each problem, give in `Short description`, `Contributor(s)/Source` and `Notes`:
- a link to the model's code;
- any paper that describes the model and its equations;
- the sources of its data;
- any study or paper that used the model.

Add a README with the steps to reproduce the problems from the framework's code (see [CONTRIBUTING.md](https://github.com/open-energy-transition/solver-benchmark/blob/main/CONTRIBUTING.md#contributing-benchmark-problems)).

- [ ] I consent to releasing these problem files under the CC BY 4.0 license.
- [ ] The problem IDs follow the convention in [benchmarks/metadata_schema.yaml](https://github.com/open-energy-transition/solver-benchmark/blob/main/benchmarks/metadata_schema.yaml).
- [ ] [solver] solves each problem to optimality in [time], with [options], on a machine with [CPU and RAM].

For the benchmark team:
- [ ] Upload the files, compressed with `gzip -9`, to our Cloud Storage bucket.
- [ ] Run `benchmarks/categorize_benchmarks.py` to add their statistics and size category.
- [ ] Run `tests/validate_urls.py` to check that the URLs match the problem IDs.
- [ ] Check that each problem's `License` is CC BY 4.0.
- [ ] Check that a solver solves the problems within our timeouts on our VMs.
- [ ] Update the summary table of the Key Insights page, if the problems add new features.

### Website changes

- [ ] I have checked my changes on the website running locally.

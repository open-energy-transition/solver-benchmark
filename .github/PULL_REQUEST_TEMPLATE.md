<!-- Title: Please prefix your PR title with `Benchmarks:`, `Website:`, `Runner:` etc, and use a short description of your changes in active voice, e.g. `add TIMES instances` or `fix scrollbar on performance history page`. -->

<!-- Please include a summary of the changes and the related issue. Please also include relevant motivation and context. -->

Fixes # [issue] <!-- if applicable, otherwise delete -->

### Benchmark contributions

Please add the following information to the description field of the metadata for each benchmark instance:
- Model code link
- Any paper describing the energy system model and its equations
- Data sources used in constructing the model
- Reference to any real-world study or published paper that this model was used for

Please add a README with instructions on how to run the model framework's code to reproduce benchmark generation, particularly if the code doesn't automatically generate MPS or LP files (see, for instance, this [example](https://github.com/open-energy-transition/solver-benchmark/blob/main/benchmarks/switch/README.md)).

### Checklist

<!-- Delete the section(s) that are not relevant to this PR type -->

**For PRs adding new benchmark instances:**
- [ ] I consent to releasing these benchmark instance files under the CC BY 4.0 license
- [ ] The benchmark name and size instance name follow the conventions indicated in the template
- [ ] I have tested that this model instance can be solved to optimality in [time] with [solver] solver, using [options], on a [spec] machine <!-- please indicate which solver, how much RAM memory your machine has, and what solver options were used -->

For Benchmark team:
- [ ] Upload the LP/MPS files (compressed using `gzip -9 <filename>`) to our GCS bucket
- [ ] Run `benchmarks/categorize_benchmarks.py` on them to obtain problem stats and size category
- [ ] Run `tests/validate_urls.py` to ensure URLs are consistent with benchmark and size instance name
- [ ] Test that some solver solves these benchmarks within our timeouts on our infra
- [ ] Add license information in the metadata file

**For changes to the website:**
- [ ] I have tested my changes by running the website locally

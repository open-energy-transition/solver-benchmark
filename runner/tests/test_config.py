"""Tests for runner/utils/config.py: the solver registry, solver
configurations, and the eligibility-rule engine.
"""

from runner.utils.config import (
    _condition_matches,
    get_conda_package_name,
    get_default_configurations,
    get_license_env_vars,
    get_solver_configuration,
    get_solver_options,
    is_solver_eligible,
    resolve_solver_name,
)


class TestGetSolverConfiguration:
    def test_unknown_configuration_returns_none(self):
        assert get_solver_configuration("not-a-configuration", config={}) is None

    def test_resolves_shared_option_values(self):
        config = {
            "shared": {"mip_gap": 1e-4},
            "configurations": {
                "highs": {
                    "solver_package": "highs",
                    "options": {"mip_rel_gap": {"shared": "mip_gap"}, "seed": 4},
                }
            },
        }
        result = get_solver_configuration("highs", config)
        assert result == {
            "solver_package": "highs",
            "options": {"mip_rel_gap": 1e-4, "seed": 4},
        }

    def test_name_lookup_is_case_insensitive(self):
        config = {
            "shared": {},
            "configurations": {"highs": {"solver_package": "highs", "options": {}}},
        }
        assert get_solver_configuration("HIGHS", config) is not None


class TestResolveSolverName:
    def test_registered_configuration_resolves_to_its_solver(self):
        config = {
            "shared": {},
            "configurations": {
                "highs-hipo": {"solver_package": "highs", "options": {}},
            },
        }
        assert resolve_solver_name("highs-hipo", config) == "highs"

    def test_unregistered_name_returns_itself_lowercased(self):
        config = {"shared": {}, "configurations": {}}
        assert resolve_solver_name("GLPK", config) == "glpk"


class TestGetSolverOptions:
    def test_returns_resolved_options(self):
        config = {
            "shared": {"mip_gap": 1e-4},
            "configurations": {
                "cbc": {
                    "solver_package": "cbc",
                    "options": {"ratioGap": {"shared": "mip_gap"}},
                }
            },
        }
        assert get_solver_options("cbc", config) == {"ratioGap": 1e-4}

    def test_unregistered_name_returns_empty_dict(self):
        config = {"shared": {}, "configurations": {}}
        assert get_solver_options("not-a-configuration", config) == {}


class TestGetDefaultConfigurations:
    def test_reads_default_configurations_list(self):
        config = {"default_configurations": ["highs", "scip"]}
        assert get_default_configurations(config) == ["highs", "scip"]

    def test_missing_key_returns_empty_list(self):
        assert get_default_configurations({}) == []


class TestGetCondaPackageName:
    def test_looks_up_package_name(self):
        config = {"packages": {"highs": "highspy"}}
        assert get_conda_package_name("highs", config) == "highspy"

    def test_falls_back_to_solver_name(self):
        config = {"packages": {}}
        assert get_conda_package_name("glpk", config) == "glpk"


class TestGetLicenseEnvVars:
    def test_looks_up_license_env_vars(self):
        config = {"license_env_vars": {"mosek": ["MOSEKLM_LICENSE_FILE"]}}
        assert get_license_env_vars("mosek", config) == ["MOSEKLM_LICENSE_FILE"]

    def test_solver_with_no_entry_returns_empty_list(self):
        config = {"license_env_vars": {}}
        assert get_license_env_vars("highs", config) == []


class TestConditionMatches:
    def test_empty_condition_matches_anything(self):
        assert _condition_matches({"year": "2025"}, {}) is True

    def test_in_operator(self):
        assert _condition_matches(
            {"size_category": "L"}, {"size_category": {"in": ["L"]}}
        )
        assert not _condition_matches(
            {"size_category": "S"}, {"size_category": {"in": ["L"]}}
        )

    def test_not_in_operator(self):
        assert _condition_matches({"solver": "highs"}, {"solver": {"not_in": ["cbc"]}})

    def test_gte_and_lte_operators_compare_as_floats(self):
        assert _condition_matches({"year": "2026"}, {"year": {"gte": "2026"}})
        assert not _condition_matches({"year": "2025"}, {"year": {"gte": "2026"}})
        assert _condition_matches({"year": "2025"}, {"year": {"lte": "2026"}})

    def test_gte_with_none_actual_is_false(self):
        assert not _condition_matches({"year": None}, {"year": {"gte": "2026"}})

    def test_multiple_facts_are_and_ed(self):
        condition = {"solver": {"in": ["cbc"]}, "year": {"in": ["2024"]}}
        assert _condition_matches({"solver": "cbc", "year": "2024"}, condition)
        assert not _condition_matches({"solver": "cbc", "year": "2023"}, condition)

    def test_dotted_key_reaches_into_nested_dict_fact(self):
        facts = {"options": {"solver": "hipo"}}
        assert _condition_matches(facts, {"options.solver": {"in": ["hipo"]}})
        assert not _condition_matches(facts, {"options.solver": {"in": ["ipx"]}})

    def test_dotted_key_missing_intermediate_dict_is_none_not_error(self):
        assert not _condition_matches(
            {"options": {}}, {"options.solver": {"in": ["hipo"]}}
        )
        assert not _condition_matches(
            {"solver": "highs"}, {"options.solver": {"in": ["hipo"]}}
        )


class TestIsSolverEligible:
    _LARGE_PROBLEM_RULE = {
        "rules": [
            {
                "name": "large_problems_runtime_budget",
                "when": {"size_category": {"in": ["L"]}},
                "allow_any_of": [
                    {"year": {"gte": "2026"}},
                    {"year": {"in": ["2025"]}},
                    {"solver": {"in": ["cbc"]}, "year": {"in": ["2024"]}},
                ],
            }
        ]
    }

    def test_untriggered_rule_imposes_no_restriction(self):
        assert is_solver_eligible(
            "highs", "2020", size_category="S", rules=self._LARGE_PROBLEM_RULE
        )

    def test_triggered_rule_blocks_when_no_alternative_matches(self):
        assert not is_solver_eligible(
            "highs", "2023", size_category="L", rules=self._LARGE_PROBLEM_RULE
        )

    def test_triggered_rule_allows_matching_alternative(self):
        assert is_solver_eligible(
            "highs", "2025", size_category="L", rules=self._LARGE_PROBLEM_RULE
        )

    def test_exception_alternative_allows_cbc_2024_on_large(self):
        assert is_solver_eligible(
            "cbc", "2024", size_category="L", rules=self._LARGE_PROBLEM_RULE
        )

    def test_no_rules_matched_means_eligible(self):
        assert is_solver_eligible("highs", "2020", rules={"rules": []})

    def test_real_eligibility_rules_restrict_highs_hipo_before_2026(self):
        # Uses the real on-disk eligibility_rules.yaml (rules=None), so this
        # doubles as a check that the shipped file parses and behaves as
        # documented for the HiPO/IPX-availability rule.
        assert not is_solver_eligible(
            "highs-hipo", "2025", size_category="S", problem_class="LP"
        )
        assert is_solver_eligible(
            "highs-hipo", "2026", size_category="S", problem_class="LP"
        )

    def test_real_eligibility_rules_restrict_hipo_to_lp(self):
        assert not is_solver_eligible(
            "highs-hipo", "2026", size_category="S", problem_class="MILP"
        )

    def test_options_fact_covers_new_configurations_automatically(self):
        # The real highs_algorithm_availability rule matches on
        # solver_package + options.solver, not an enumerated list of
        # configuration names -- so a brand new hipo-tuned configuration is
        # restricted without touching eligibility_rules.yaml.
        fake_solver_configurations = {
            "configurations": {
                "highs-hipo-256": {
                    "solver_package": "highs",
                    "options": {"solver": "hipo", "hipo_block_size": 256},
                }
            }
        }
        assert not is_solver_eligible(
            "highs-hipo-256",
            "2025",
            size_category="S",
            problem_class="LP",
            config=fake_solver_configurations,
        )
        assert is_solver_eligible(
            "highs-hipo-256",
            "2026",
            size_category="S",
            problem_class="LP",
            config=fake_solver_configurations,
        )

    def test_solver_package_scopes_options_key_to_the_right_solver(self):
        # A different solver's configuration that happens to set an option
        # also named "solver" must not be caught by the HiGHS-scoped rule --
        # solver_package is what scopes options.solver to HiGHS specifically.
        fake_solver_configurations = {
            "configurations": {
                "other-solver": {
                    "solver_package": "other",
                    "options": {"solver": "hipo"},
                }
            }
        }
        assert is_solver_eligible(
            "other-solver",
            "2025",
            size_category="S",
            problem_class="LP",
            config=fake_solver_configurations,
        )


def test_load_functions_read_real_config_files():
    # Smoke test that the real shipped YAML files parse and satisfy the
    # shapes the rest of this module assumes (see individual tests above for
    # behavior); a parse error here would otherwise only surface at runtime
    # deep inside a benchmark run.
    from runner.utils.config import (
        load_eligibility_rules,
        load_solver_configurations,
        load_solver_registry,
    )

    assert "solvers" in load_solver_registry()
    assert "configurations" in load_solver_configurations()
    assert "rules" in load_eligibility_rules()

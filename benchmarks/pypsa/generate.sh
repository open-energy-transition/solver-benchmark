#!/bin/bash
set -eu

# The commands to generate each benchmark:
readarray -t commands << 'EOF'
snakemake -call all --cores all --printshellcmds --configfile ./solver-benchmarks/pypsa-eur-sec-2-24h.yaml
snakemake -call solve_elec_networks --cores all --printshellcmds --configfile ./solver-benchmarks/pypsa-eur-elec-trex-3-24h.yaml
snakemake -call results/networks/base_s_3_elec_lv1_24h_op.nc --cores all --printshellcmds --configfile ./solver-benchmarks/pypsa-eur-elec-op-3-24h.yaml
snakemake -call results/networks/base_s_3_elec_lv1_24h_op.nc --cores all --printshellcmds --configfile ./solver-benchmarks/pypsa-eur-elec-op-ucconv-3-24h.yaml
python ./solver-benchmarks/pypsa-gas+wind+sol+ely-1-1h.py
python ./solver-benchmarks/pypsa-gas+wind+sol+ely-ucgas-1-1h.py
EOF

for cmd in "${commands[@]}"; do
    echo
    echo "Running: $cmd"

    # Run the command and capture stdout and stderr
    temp_output_file=$(mktemp)
    $cmd 2>&1 | tee "$temp_output_file"
    return_code=$?
    echo "Command completed with retcode: $return_code"

    if grep -q "Solver problem file written to" "$temp_output_file"; then
        echo "Assuming benchmark generated successfully and continuing..."
    else
        echo "ERROR: Command failed without generating benchmark"
        exit 1
    fi
done

echo "All benchmarks generated successfully."

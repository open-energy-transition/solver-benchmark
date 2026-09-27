"""Monitor in-progress cloud benchmark runs: which VMs are up, and whether
any of them look hung.
"""

import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed


def get_running_instances() -> list[str]:
    """List currently running GCE VM instances.

    Returns
    -------
    list[str]
        One `"<name> <zone>"` string per running instance, as reported by
        `gcloud compute instances list`. Empty if the `gcloud` call fails.
    """
    try:
        result = subprocess.run(
            [
                "gcloud",
                "compute",
                "instances",
                "list",
                "--filter=status:RUNNING",
                "--format=value(name,zone)",
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip().splitlines()
    except subprocess.CalledProcessError as e:
        print(f"Error fetching instances: {e}")
        return []


def check_uptime_of_instance(instance: str) -> str:
    """SSH into one instance and report its uptime.

    Parameters
    ----------
    instance : str
        `"<name> <zone>"`, as returned by `get_running_instances`.

    Returns
    -------
    str
        `"<name>: <uptime output>"`, or `"<name>: Error - ..."` if the SSH
        command failed.
    """
    name, zone = instance.split()
    try:
        result = subprocess.run(
            [
                "gcloud",
                "compute",
                "ssh",
                name,
                "--zone",
                zone,
                "--command",
                "uptime",
                "--quiet",
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        return f"{name}: {result.stdout.strip()}"
    except subprocess.CalledProcessError as e:
        return f"{name}: Error - {e}"


def check_uptimes() -> None:
    """Print the uptime of every running instance, flagging likely-hung ones.

    Checks all instances from `get_running_instances` in parallel over SSH,
    and prints a summary of instances whose load average (`uptime`'s last
    field) is below 1.0 -- a proxy for "not actively running a benchmark".
    """
    instances = get_running_instances()
    print(f"There are {len(instances)} running instances")

    hung_vms = []

    # Use ThreadPoolExecutor to run uptime checks in parallel
    with ThreadPoolExecutor() as executor:
        future_to_instance = {
            executor.submit(check_uptime_of_instance, instance): instance
            for instance in instances
        }

        for future in as_completed(future_to_instance):
            instance = future_to_instance[future]
            try:
                uptime_info = future.result()
                print(uptime_info)
                if float(uptime_info.split()[-1]) < 1.0:
                    hung_vms.append(uptime_info)
            except Exception as e:
                print(f"{instance}: Exception - {e}")

    msg = "\n".join(hung_vms)
    print(f"\n{len(hung_vms)} potentially hung instances:\n{msg}")

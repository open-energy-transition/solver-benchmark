#!/usr/bin/env python3
"""
Async multithreaded script to query GCP VMs with a specific name prefix.
Uses gcloud CLI with asyncio subprocess for parallel execution.
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any


class GCloudError(Exception):
    """Raised when gcloud command fails."""

    pass


async def run_gcloud_command(args: list[str], timeout: int = 30) -> str:
    """
    Run a gcloud command asynchronously.

    Args:
        args: Command arguments (without 'gcloud' prefix)
        timeout: Command timeout in seconds

    Returns:
        Command stdout as string

    Raises:
        GCloudError: If command fails
        asyncio.TimeoutError: If command times out
    """
    cmd = ["gcloud"] + args

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)

        if process.returncode != 0:
            raise GCloudError(
                f"Command failed: {' '.join(cmd)}\n"
                f"Exit code: {process.returncode}\n"
                f"Stderr: {stderr.decode()}"
            )

        return stdout.decode()

    except asyncio.TimeoutError:
        process.kill()
        await process.wait()
        raise asyncio.TimeoutError(
            f"Command timed out after {timeout}s: {' '.join(cmd)}"
        )


async def get_current_project() -> str | None:
    """Get the current/default GCP project from gcloud config."""
    try:
        result = await run_gcloud_command(["config", "get-value", "project"], timeout=5)
        project = result.strip()
        return project if project and project != "(unset)" else None
    except (GCloudError, asyncio.TimeoutError):
        return None


async def list_all_projects() -> list[dict[str, Any]]:
    """
    List all accessible GCP projects.

    Returns:
        List of project dictionaries
    """
    try:
        result = await run_gcloud_command(["projects", "list", "--format=json"])

        projects = json.loads(result)
        # Filter to only active projects
        return [p for p in projects if p.get("lifecycleState") == "ACTIVE"]

    except (GCloudError, json.JSONDecodeError) as e:
        print(f"Error listing projects: {e}", file=sys.stderr)
        return []


async def list_zones_for_project(project_id: str) -> list[str]:
    """
    List all zones for a specific project.

    Args:
        project_id: GCP project ID

    Returns:
        List of zone names
    """
    try:
        result = await run_gcloud_command(
            ["compute", "zones", "list", f"--project={project_id}", "--format=json"]
        )

        zones = json.loads(result)
        return [zone["name"] for zone in zones]

    except (GCloudError, json.JSONDecodeError):
        # Silently skip projects without compute API enabled or permission issues
        return []


async def list_instances_in_zone(
    project_id: str, zone: str, name_filter: str
) -> list[dict[str, Any]]:
    """
    List VM instances in a specific zone matching a name filter.

    Args:
        project_id: GCP project ID
        zone: Zone name
        name_filter: Name prefix to filter by

    Returns:
        List of instance dictionaries
    """
    try:
        result = await run_gcloud_command(
            [
                "compute",
                "instances",
                "list",
                f"--project={project_id}",
                f"--zones={zone}",
                f"--filter=name:{name_filter}*",
                "--format=json",
            ]
        )

        instances = json.loads(result)
        # Add project and zone info to each instance
        for instance in instances:
            instance["_project"] = project_id
            instance["_zone"] = zone

        return instances

    except (GCloudError, json.JSONDecodeError):
        # Silently skip zones with permission issues
        return []


def substitute_variables(text: str, vm_instance: dict[str, Any]) -> str:
    """
    Substitute placeholder variables in text with VM instance values.

    Supported variables:
        {vm_name} - VM instance name
        {vm_zone} - VM zone
        {vm_project} - VM project ID
        {vm_internal_ip} - Internal IP address
        {vm_external_ip} - External IP address (if available)
        {vm_machine_type} - Machine type (e.g., n1-standard-4)
        {vm_status} - VM status (RUNNING, STOPPED, etc.)

    Args:
        text: Text with placeholder variables
        vm_instance: VM instance dictionary

    Returns:
        Text with variables replaced
    """
    # Extract network info
    network_interfaces = vm_instance.get("networkInterfaces", [])
    internal_ip = (
        network_interfaces[0].get("networkIP", "") if network_interfaces else ""
    )

    external_ip = ""
    if network_interfaces and network_interfaces[0].get("accessConfigs"):
        external_ip = network_interfaces[0]["accessConfigs"][0].get("natIP", "")

    # Extract machine type (just the type name, not full URL)
    machine_type = (
        vm_instance.get("machineType", "").split("/")[-1]
        if vm_instance.get("machineType")
        else ""
    )

    # Build substitution map
    variables = {
        "vm_name": vm_instance.get("name", ""),
        "vm_zone": vm_instance.get("_zone", ""),
        "vm_project": vm_instance.get("_project", ""),
        "vm_internal_ip": internal_ip,
        "vm_external_ip": external_ip,
        "vm_machine_type": machine_type,
        "vm_status": vm_instance.get("status", ""),
    }

    # Substitute all variables
    result = text
    for var_name, var_value in variables.items():
        result = result.replace(f"{{{var_name}}}", var_value)

    return result


async def scp_vm(
    project_id: str,
    zone: str,
    vm_name: str,
    vm_instance: dict[str, Any],
    source: str,
    destination: str,
    recursive: bool = False,
    timeout: int = 120,
) -> tuple[str, bool, str]:
    """
    SCP files to/from a VM using gcloud compute scp.

    Args:
        project_id: GCP project ID
        zone: Zone name
        vm_name: VM instance name
        vm_instance: Full VM instance dictionary (for variable substitution)
        source: Source path (use 'vm:path' format for remote source, supports {variables})
        destination: Destination path (use 'vm:path' format for remote destination, supports {variables})
        recursive: Whether to copy recursively
        timeout: Command timeout in seconds

    Returns:
        Tuple of (vm_name, success, error_message)

    Examples:
        # Upload to VM
        scp_vm(proj, zone, "my-vm", vm_dict, "/local/file", "vm:/remote/path")

        # Download from VM with variable substitution
        scp_vm(proj, zone, "my-vm", vm_dict, "vm:/remote/file", "/local/{vm_name}/file")
    """
    # Substitute variables in paths
    source = substitute_variables(source, vm_instance)
    destination = substitute_variables(destination, vm_instance)

    # Determine if we're downloading (source is remote)
    is_download = source.startswith("vm:")

    # Replace 'vm:' prefix with actual VM name
    if source.startswith("vm:"):
        source = f"{vm_name}:{source[3:]}"
    if destination.startswith("vm:"):
        destination = f"{vm_name}:{destination[3:]}"

    # Create destination directory if downloading to local path
    if is_download:
        dest_path = Path(destination)
        # If destination looks like a directory (ends with /) or is an existing directory
        if destination.endswith("/") or (dest_path.exists() and dest_path.is_dir()):
            dest_path.mkdir(parents=True, exist_ok=True)
        else:
            # Create parent directory for the file
            dest_path.parent.mkdir(parents=True, exist_ok=True)

    args = [
        "compute",
        "scp",
        source,
        destination,
        f"--project={project_id}",
        f"--zone={zone}",
        # "--tunnel-through-iap",
    ]

    if recursive:
        args.append("--recurse")

    try:
        await run_gcloud_command(args, timeout=timeout)
        return (vm_name, True, "")
    except (GCloudError, asyncio.TimeoutError) as e:
        return (vm_name, False, str(e))


async def ssh_exec_on_vm(
    project_id: str,
    zone: str,
    vm_name: str,
    vm_instance: dict[str, Any],
    command: str,
    timeout: int = 120,
) -> tuple[str, bool, str, str]:
    """
    Execute SSH command on a VM using gcloud compute ssh.

    Args:
        project_id: GCP project ID
        zone: Zone name
        vm_name: VM instance name
        vm_instance: Full VM instance dictionary (for variable substitution)
        command: Command to execute (supports {variables})
        timeout: Command timeout in seconds

    Returns:
        Tuple of (vm_name, success, stdout, stderr)
    """
    # Substitute variables in command
    command = substitute_variables(command, vm_instance)
    args = [
        "compute",
        "ssh",
        vm_name,
        f"--project={project_id}",
        f"--zone={zone}",
        # "--tunnel-through-iap",
        "--command",
        command,
    ]

    cmd = ["gcloud"] + args

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)

        success = process.returncode == 0
        return (vm_name, success, stdout.decode(), stderr.decode())

    except asyncio.TimeoutError:
        process.kill()
        await process.wait()
        return (vm_name, False, "", f"Command timed out after {timeout}s")
    except Exception as e:
        return (vm_name, False, "", str(e))


async def query_vms_in_projects(
    project_ids: list[str], name_prefix: str, max_concurrent: int = 20
) -> list[dict[str, Any]]:
    """
    Query VMs across multiple projects and zones concurrently.

    Args:
        project_ids: List of project IDs to search
        name_prefix: Name prefix to filter by
        max_concurrent: Maximum concurrent operations

    Returns:
        List of instance dictionaries
    """
    all_instances = []

    # Semaphore to limit concurrent operations
    semaphore = asyncio.Semaphore(max_concurrent)

    async def get_zones_with_semaphore(project_id: str) -> tuple[str, list[str]]:
        async with semaphore:
            zones = await list_zones_for_project(project_id)
            return project_id, zones

    async def query_zone_with_semaphore(
        project_id: str, zone: str
    ) -> list[dict[str, Any]]:
        async with semaphore:
            return await list_instances_in_zone(project_id, zone, name_prefix)

    # First, gather all zones across projects
    print(f"Discovering zones across {len(project_ids)} projects...")
    zone_tasks = [get_zones_with_semaphore(pid) for pid in project_ids]
    zone_results = await asyncio.gather(*zone_tasks, return_exceptions=True)

    # Build list of (project, zone) tuples
    project_zones = []
    for result in zone_results:
        if isinstance(result, Exception):
            continue
        project_id, zones = result
        project_zones.extend([(project_id, zone) for zone in zones])

    print(f"Querying VMs across {len(project_zones)} zones...")

    # Query all zones concurrently
    query_tasks = [
        query_zone_with_semaphore(project_id, zone)
        for project_id, zone in project_zones
    ]

    # Progress tracking
    completed = 0
    for coro in asyncio.as_completed(query_tasks):
        try:
            instances = await coro
            all_instances.extend(instances)
            completed += 1
            if completed % 50 == 0:
                print(f"Progress: {completed}/{len(query_tasks)} zones checked")
        except Exception as e:
            print(f"Error querying zone: {e}", file=sys.stderr)
            completed += 1

    return all_instances


def format_as_table(instances: list[dict[str, Any]]) -> str:
    """Format VM instances as a table."""
    if not instances:
        return "No VMs found"

    lines = []
    header = f"{'Project':<30} {'Zone':<20} {'Name':<30} {'Status':<12} {'Machine Type':<20} {'Internal IP':<15} {'External IP':<15}"
    lines.append(header)
    lines.append("-" * 162)

    for vm in instances:
        project = vm.get("_project", "")
        zone = vm.get("_zone", "")
        name = vm.get("name", "")
        status = vm.get("status", "")

        machine_type = (
            vm.get("machineType", "").split("/")[-1] if vm.get("machineType") else "N/A"
        )

        network_interfaces = vm.get("networkInterfaces", [])
        internal_ip = (
            network_interfaces[0].get("networkIP", "N/A")
            if network_interfaces
            else "N/A"
        )

        external_ip = "N/A"
        if network_interfaces and network_interfaces[0].get("accessConfigs"):
            external_ip = network_interfaces[0]["accessConfigs"][0].get("natIP", "N/A")

        lines.append(
            f"{project:<30} {zone:<20} {name:<30} {status:<12} "
            f"{machine_type:<20} {internal_ip:<15} {external_ip:<15}"
        )

    return "\n".join(lines)


def format_as_json(instances: list[dict[str, Any]]) -> str:
    """Format VM instances as JSON."""
    return json.dumps(instances, indent=2)


def format_as_csv(instances: list[dict[str, Any]]) -> str:
    """Format VM instances as CSV."""
    import csv
    import io

    if not instances:
        return ""

    output = io.StringIO()
    fieldnames = [
        "project",
        "zone",
        "name",
        "machine_type",
        "status",
        "internal_ip",
        "external_ip",
        "created",
        "id",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for vm in instances:
        network_interfaces = vm.get("networkInterfaces", [])
        internal_ip = (
            network_interfaces[0].get("networkIP", "") if network_interfaces else ""
        )

        external_ip = ""
        if network_interfaces and network_interfaces[0].get("accessConfigs"):
            external_ip = network_interfaces[0]["accessConfigs"][0].get("natIP", "")

        row = {
            "project": vm.get("_project", ""),
            "zone": vm.get("_zone", ""),
            "name": vm.get("name", ""),
            "machine_type": (
                vm.get("machineType", "").split("/")[-1]
                if vm.get("machineType")
                else ""
            ),
            "status": vm.get("status", ""),
            "internal_ip": internal_ip,
            "external_ip": external_ip,
            "created": vm.get("creationTimestamp", ""),
            "id": vm.get("id", ""),
        }
        writer.writerow(row)

    return output.getvalue()


async def scp_on_vms(
    instances: list[dict[str, Any]],
    source: str,
    destination: str,
    recursive: bool = False,
    max_concurrent: int = 10,
    timeout: int = 120,
):
    """
    SCP files to/from multiple VMs concurrently.

    Args:
        instances: List of VM instance dictionaries
        source: Source path (use 'vm:path' for remote)
        destination: Destination path (use 'vm:path' for remote)
        recursive: Whether to copy recursively (auto-detected if not specified)
        max_concurrent: Maximum concurrent operations
        timeout: Command timeout in seconds
    """
    # Auto-detect recursive mode if not explicitly set
    if not recursive:
        # Extract the actual paths (remove 'vm:' prefix for analysis)
        src_path = source[3:] if source.startswith("vm:") else source
        dst_path = destination[3:] if destination.startswith("vm:") else destination

        # Enable recursive if:
        # 1. Source ends with / or /* (clearly a directory)
        # 2. Destination ends with / (target is a directory)
        # 3. Source has no file extension (likely a directory)
        from pathlib import Path
        src_name = Path(src_path).name
        has_extension = "." in src_name and not src_name.startswith(".")

        if (
            src_path.endswith("/")
            or src_path.endswith("/*")
            or (dst_path.endswith("/") and not has_extension)
        ):
            recursive = True
            print("Auto-detected directory copy, enabling recursive mode")

    semaphore = asyncio.Semaphore(max_concurrent)

    async def scp_with_semaphore(vm):
        async with semaphore:
            return await scp_vm(
                vm["_project"],
                vm["_zone"],
                vm["name"],
                vm,
                source,
                destination,
                recursive,
                timeout,
            )

    direction = "from" if source.startswith("vm:") else "to"
    print(f"Copying {direction} {len(instances)} VMs...")

    tasks = [scp_with_semaphore(vm) for vm in instances]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    success_count = 0
    for result in results:
        if isinstance(result, Exception):
            print(f"ERROR: {result}", file=sys.stderr)
            continue

        if isinstance(result, tuple) and len(result) == 3:
            vm_name, success, error_msg = result
            if success:
                print(f"✓ {vm_name}: Success")
                success_count += 1
            else:
                print(f"✗ {vm_name}: {error_msg}", file=sys.stderr)

    print(f"\nCompleted: {success_count}/{len(instances)} successful")


async def ssh_exec_on_vms(
    instances: list[dict[str, Any]],
    command: str,
    max_concurrent: int = 10,
    timeout: int = 120,
    show_output: bool = True,
):
    """
    Execute SSH command on multiple VMs concurrently.

    Args:
        instances: List of VM instance dictionaries
        command: Command to execute
        max_concurrent: Maximum concurrent operations
        timeout: Command timeout in seconds
        show_output: Whether to show stdout/stderr
    """
    semaphore = asyncio.Semaphore(max_concurrent)

    async def ssh_with_semaphore(vm):
        async with semaphore:
            return await ssh_exec_on_vm(
                vm["_project"], vm["_zone"], vm["name"], vm, command, timeout
            )

    print(f"Executing command on {len(instances)} VMs: {command}")

    tasks = [ssh_with_semaphore(vm) for vm in instances]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    success_count = 0
    for result in results:
        if isinstance(result, Exception):
            print(f"ERROR: {result}", file=sys.stderr)
            continue

        if isinstance(result, tuple) and len(result) == 4:
            vm_name, success, stdout, stderr = result
            if success:
                print(f"\n{'='*60}")
                print(f"✓ {vm_name}: Success")
                if show_output and stdout:
                    print(f"STDOUT:\n{stdout}")
                success_count += 1
            else:
                print(f"\n{'='*60}")
                print(f"✗ {vm_name}: Failed")
                if show_output and stderr:
                    print(f"STDERR:\n{stderr}", file=sys.stderr)

    print(f"\n{'='*60}")
    print(f"Completed: {success_count}/{len(instances)} successful")


async def main_async(args):
    """Async main function."""

    # Determine which projects to search
    if args.projects:
        project_ids = args.projects
        print(f"Searching specified projects: {', '.join(project_ids)}")
    elif args.all_projects:
        print("Fetching all accessible projects...")
        projects = await list_all_projects()
        project_ids = [p["projectId"] for p in projects]
        if not project_ids:
            print("No projects found.", file=sys.stderr)
            sys.exit(1)
        print(f"Found {len(project_ids)} projects")
    else:
        # Default to current project
        current_project = await get_current_project()
        if not current_project:
            print("Could not detect current project. Please either:", file=sys.stderr)
            print(
                "  - Set a default project: gcloud config set project PROJECT_ID",
                file=sys.stderr,
            )
            print("  - Specify projects with --projects", file=sys.stderr)
            print(
                "  - Use --all-projects to search all accessible projects",
                file=sys.stderr,
            )
            sys.exit(1)
        project_ids = [current_project]
        print(f"Using current project: {current_project}")

    # Query VMs
    instances = await query_vms_in_projects(
        project_ids, args.name_prefix, args.max_concurrent
    )

    # Output results
    if not instances:
        print(f"\nNo VMs found with prefix '{args.name_prefix}'")
        return

    print(f"\nFound {len(instances)} matching VMs")

    # Handle SCP mode
    if args.scp_source and args.scp_dest:
        await scp_on_vms(
            instances,
            args.scp_source,
            args.scp_dest,
            args.recursive,
            args.max_concurrent,
            args.timeout,
        )
        return

    # Handle SSH mode
    if args.ssh:
        await ssh_exec_on_vms(
            instances, args.ssh, args.max_concurrent, args.timeout, not args.no_output
        )
        return

    # Default: just list VMs
    print()
    if args.output == "json":
        print(format_as_json(instances))
    elif args.output == "csv":
        print(format_as_csv(instances))
    else:  # table format
        print(format_as_table(instances))


def main():
    parser = argparse.ArgumentParser(
        description="Query GCP VMs with a specific name prefix using async gcloud commands",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # List VMs
  %(prog)s my-vm-prefix

  # SCP files to VMs
  %(prog)s my-vm-prefix --scp-source /local/file.txt --scp-dest vm:/remote/path/

  # SCP files from VMs (with variable substitution to avoid overwriting)
  %(prog)s my-vm-prefix --scp-source vm:/remote/log.txt --scp-dest /local/logs/{vm_name}/log.txt

  # SCP with multiple variables
  %(prog)s my-vm-prefix --scp-source vm:/var/log/app.log --scp-dest /local/{vm_zone}/{vm_name}/app.log --recursive

  # Execute SSH command
  %(prog)s my-vm-prefix --ssh "uptime"

  # Execute SSH command with variables
  %(prog)s my-vm-prefix --ssh "echo 'Running on {vm_name} in {vm_zone}'"

Supported variables (for SCP paths and SSH commands):
  {vm_name}         - VM instance name
  {vm_zone}         - VM zone
  {vm_project}      - VM project ID
  {vm_internal_ip}  - Internal IP address
  {vm_external_ip}  - External IP address
  {vm_machine_type} - Machine type
  {vm_status}       - VM status
        """,
    )
    parser.add_argument(
        "name_prefix", help="Name prefix to search for (e.g., 'web-server-')"
    )
    parser.add_argument(
        "--projects",
        nargs="+",
        help="Specific project IDs to search (default: current project)",
    )
    parser.add_argument(
        "--all-projects",
        action="store_true",
        help="Search across all accessible projects",
    )
    parser.add_argument(
        "--max-concurrent",
        type=int,
        default=20,
        help="Maximum concurrent gcloud operations (default: 20)",
    )
    parser.add_argument(
        "--output",
        choices=["table", "json", "csv"],
        default="table",
        help="Output format for VM listing (default: table)",
    )

    # SCP options
    scp_group = parser.add_argument_group("SCP options")
    scp_group.add_argument(
        "--scp-source", help="Source path for SCP (use 'vm:/path' for remote source)"
    )
    scp_group.add_argument(
        "--scp-dest",
        help="Destination path for SCP (use 'vm:/path' for remote destination)",
    )
    scp_group.add_argument(
        "--recursive", action="store_true", help="Copy directories recursively"
    )

    # SSH options
    ssh_group = parser.add_argument_group("SSH options")
    ssh_group.add_argument("--ssh", help="Command to execute via SSH on all VMs")
    ssh_group.add_argument(
        "--no-output",
        action="store_true",
        help="Don't show stdout/stderr from SSH commands",
    )
    ssh_group.add_argument(
        "--timeout",
        type=int,
        default=120,
        help="Timeout for SSH/SCP operations in seconds (default: 120)",
    )

    args = parser.parse_args()

    # Validate argument combinations
    if args.scp_source and not args.scp_dest:
        parser.error("--scp-dest is required when using --scp-source")
    if args.scp_dest and not args.scp_source:
        parser.error("--scp-source is required when using --scp-dest")
    if args.scp_source and args.ssh:
        parser.error("Cannot use --scp-source and --ssh together")
    if args.recursive and not args.scp_source:
        parser.error("--recursive can only be used with --scp-source/--scp-dest")

    # Run async main
    try:
        asyncio.run(main_async(args))
    except KeyboardInterrupt:
        print("\nInterrupted by user", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

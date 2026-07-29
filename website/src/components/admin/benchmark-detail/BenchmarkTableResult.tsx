import React, { useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Color } from "@/constants/color";
import { MetaDataEntry } from "@/types/meta-data";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import { TanStackTable } from "@/components/shared/tables/TanStackTable";
import InfoPopup from "@/components/common/InfoPopup";
import { RealisticOption, SolvedOption } from "@/types/state";
import { useBenchmarkResults } from "@/hooks/useBenchmarkResults";
import { getProblemKey } from "@/utils/results";

interface IColumnTable extends MetaDataEntry {
  name: string;
}

// Type for File System Access API
interface FileSystemDirectoryHandle {
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<FileSystemFileHandle>;
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource): Promise<void>;
  close(): Promise<void>;
}

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
}

interface BenchmarkTableResultProps {
  metaData: Record<string, MetaDataEntry>;
  problemSizeFilter?: string[];
  realisticFilter?: string[];
}

// Truncates to fit the actual rendered width of its container (which
// TanStackTable resizes as the column width changes) instead of a fixed
// character count, and only enables the hover popup when text is actually
// being cut off.
const TruncatedText = ({ text }: { text: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const checkOverflow = () =>
      setIsOverflowing(el.scrollWidth > el.clientWidth);
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  return (
    <InfoPopup
      disabled={!isOverflowing}
      trigger={() => (
        <div
          ref={ref}
          className="w-full whitespace-nowrap text-ellipsis overflow-hidden"
        >
          {text}
        </div>
      )}
      position="top center"
      closeOnDocumentClick
      arrowStyle={{ color: Color.Stroke }}
    >
      <div>{text}</div>
    </InfoPopup>
  );
};

const BenchmarkTableResult: React.FC<BenchmarkTableResultProps> = ({
  metaData,
  problemSizeFilter = [],
  realisticFilter = [],
}) => {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(
    new Set(),
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    currentFile: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const benchmarkResults = useBenchmarkResults();
  const solvedProblemIds = useMemo(
    () => new Set(benchmarkResults.map(getProblemKey)),
    [benchmarkResults],
  );

  const memoizedMetaData = useMemo(
    () =>
      Object.entries(metaData).map(([key, value]) => ({
        ...value,
        name: key,
      })),
    [metaData],
  );

  const searchedMetaData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return memoizedMetaData;
    return memoizedMetaData.filter((item) =>
      item.name.toLowerCase().includes(query),
    );
  }, [memoizedMetaData, searchQuery]);

  const handleSelectAll = () => {
    if (selectedProblems.size === searchedMetaData.length) {
      setSelectedProblems(new Set());
    } else {
      setSelectedProblems(new Set(searchedMetaData.map((b) => b.name)));
    }
  };

  const handleToggleSelect = (name: string) => {
    const newSelected = new Set(selectedProblems);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedProblems(newSelected);
  };

  const handleDownloadSelected = async () => {
    if (selectedProblems.size === 0) {
      alert("Please select at least one problem to download");
      return;
    }

    // Check if File System Access API is supported
    if (!("showDirectoryPicker" in window)) {
      alert(
        "Your browser doesn't support the File System Access API. Please use Chrome, Edge, or another compatible browser.",
      );
      return;
    }

    try {
      setIsDownloading(true);

      // Ask user to choose destination folder once
      const dirHandle = await window.showDirectoryPicker();

      const selectedFiles = memoizedMetaData.filter((b) =>
        selectedProblems.has(b.name),
      );

      setDownloadProgress({
        current: 0,
        total: selectedFiles.length,
        currentFile: "",
      });

      // Collect all files to download
      const filesToDownload: Array<{
        problemId: string;
        url: string;
        filename: string;
      }> = [];

      for (const problem of selectedFiles) {
        const hasUrl = !!problem.url;
        const matchesSizeFilter =
          !!problem.size && problemSizeFilter.includes(problem.size);
        const matchesRealisticFilter =
          (problem.realistic === true &&
            realisticFilter.includes(RealisticOption.Realistic)) ||
          ((problem.realistic === false || problem.realistic === undefined) &&
            realisticFilter.includes(RealisticOption.Other));

        const matchesFilters =
          hasUrl && matchesSizeFilter && matchesRealisticFilter;

        if (!matchesFilters) {
          console.warn(
            `No download URL found for ${problem.name} matching filters`,
          );
          alert(
            `No download URL found for ${problem.name} matching filters. Skipping...`,
          );
          continue;
        }

        const urlParts = problem.url!.split("/");
        const filename = urlParts[urlParts.length - 1] || `${problem.name}.lp`;
        filesToDownload.push({
          problemId: problem.name,
          url: problem.url!,
          filename,
        });
      }

      setDownloadProgress({
        current: 0,
        total: filesToDownload.length,
        currentFile: "",
      });

      // Download all files
      for (let i = 0; i < filesToDownload.length; i++) {
        const { problemId: _problemId, url, filename } = filesToDownload[i];

        setDownloadProgress({
          current: i + 1,
          total: filesToDownload.length,
          currentFile: filename,
        });

        console.log(`Starting download: ${filename} from ${url}`);

        try {
          // Create or overwrite file inside selected folder
          const fileHandle = await dirHandle.getFileHandle(filename, {
            create: true,
          });
          const writable = await fileHandle.createWritable();

          const response = await fetch(
            `/api/download?url=${encodeURIComponent(url)}`,
          );

          if (!response.ok) {
            throw new Error(
              `Failed to download ${filename}: ${response.statusText}`,
            );
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error(`No response body for ${filename}`);
          }

          // Stream chunks directly to file on disk
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            await writable.write(value);
          }

          await writable.close();
          console.log(`✅ Finished: ${filename}`);
        } catch (error) {
          console.error(`Error downloading ${filename}:`, error);
          alert(`Failed to download ${filename}. Continuing with next file...`);
        }
      }

      setDownloadProgress(null);
      setIsDownloading(false);
      alert("🎉 All selected files downloaded successfully!");

      // Clear selection and exit select mode
      setSelectedProblems(new Set());
      setIsSelectMode(false);
    } catch (error) {
      console.error("Download error:", error);
      setIsDownloading(false);
      setDownloadProgress(null);

      if ((error as Error).name === "AbortError") {
        alert("Download cancelled by user");
      } else {
        alert(`Download failed: ${(error as Error).message}`);
      }
    }
  };

  const handleCancelSelection = () => {
    setSelectedProblems(new Set());
    setIsSelectMode(false);
  };

  // Prevent tab/window close during download
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDownloading) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDownloading]);

  const columns = useMemo<ColumnDef<IColumnTable>[]>(
    () => [
      ...(isSelectMode
        ? [
            {
              id: "select",
              header: () => (
                <div>
                  <input
                    type="checkbox"
                    checked={
                      selectedProblems.size === searchedMetaData.length &&
                      searchedMetaData.length > 0
                    }
                    onChange={handleSelectAll}
                    className="cursor-pointer w-4 h-4"
                    aria-label="Select all problems"
                  />
                </div>
              ),
              cell: (info: { row: { original: IColumnTable } }) => (
                <div>
                  <input
                    type="checkbox"
                    checked={selectedProblems.has(info.row.original.name)}
                    onChange={() => handleToggleSelect(info.row.original.name)}
                    className="cursor-pointer w-4 h-4"
                    aria-label={`Select ${info.row.original.name}`}
                  />
                </div>
              ),
              size: 50,
              enableSorting: false,
              enableColumnFilter: false,
              meta: {
                headerClassName: "overflow-visible",
              },
            },
          ]
        : []),
      {
        header: "PROBLEM ID",
        accessorKey: "name",
        size: 300,
        enableSorting: true,
        enableColumnFilter: false,
        cell: (info) => (
          <Link
            className="font-bold block w-full"
            style={{ lineHeight: "1.5" }}
            href={PATH_DASHBOARD.benchmarkSet.one.replace(
              "{name}",
              info.row.original.name,
            )}
            aria-label="problem-link"
          >
            <TruncatedText text={info.getValue() as string} />
          </Link>
        ),
      },
      {
        header: "PROBLEM CLASS",
        accessorKey: "problemClass",
        enableColumnFilter: false,
        size: 180,
        cell: (info) => info.getValue(),
      },
      {
        header: "PROBLEM SIZE",
        accessorKey: "size",
        enableColumnFilter: false,
        size: 150,
        cell: (info) => info.getValue(),
      },
      {
        header: "SOLVED",
        id: "solved",
        accessorFn: (row) =>
          solvedProblemIds.has(row.name)
            ? SolvedOption.Solved
            : SolvedOption.NotSolved,
        enableColumnFilter: false,
        size: 150,
        cell: (info) => info.getValue(),
      },
    ],
    [isSelectMode, selectedProblems, searchedMetaData.length, solvedProblemIds],
  );

  return (
    <div>
      <div className="sm:flex items-center justify-between my-4 md:mt-0">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by problem ID..."
          className="w-full sm:w-72 px-3 py-2 border border-stroke rounded-lg text-sm text-navy focus:outline-none focus:border-navy"
          aria-label="Search by problem ID"
        />

        <div className="flex gap-2 justify-end mt-2 sm:mt-0 shrink-0">
          {!isSelectMode ? (
            <button
              onClick={() => setIsSelectMode(true)}
              className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-semibold"
            >
              Select for Download
            </button>
          ) : (
            <>
              <button
                onClick={handleDownloadSelected}
                disabled={isDownloading || selectedProblems.size === 0}
                className="px-4 py-2 bg-navy text-white rounded-lg transition-colors text-sm font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isDownloading
                  ? `Downloading... (${downloadProgress?.current || 0}/${
                      downloadProgress?.total || 0
                    })`
                  : `Download Selected (${selectedProblems.size})`}
              </button>
              <button
                onClick={handleCancelSelection}
                disabled={isDownloading}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Cancel Selection
              </button>
            </>
          )}
        </div>
      </div>

      {downloadProgress && (
        <div className="mb-4 p-4 bg-[#F4F6FA]  border border-[#e5e7eb] rounded-lg animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-navy flex items-center gap-2">
              <span className="inline-block animate-pulse">⬇️</span>
              Downloading: {downloadProgress.currentFile}
            </span>
            <span className="text-sm text-navy font-semibold">
              {downloadProgress.current} of {downloadProgress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-teal h-2.5 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{
                width: `${
                  (downloadProgress.current / downloadProgress.total) * 100
                }%`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
            </div>
          </div>
        </div>
      )}

      <div>
        <TanStackTable
          showAllRows
          virtualizedHeight="70vh"
          data={searchedMetaData}
          columns={columns}
          headerClassName="text-left text-navy py-4 px-6 cursor-pointer"
          oddRowClassName="odd:bg-[#BFD8C733]"
        />
      </div>
      <div>
        <div className="text-xs my-4">
          <div className="text-dark-grey tag-line-xxs">
            Showing {searchedMetaData.length} benchmark problems matching the
            filters
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkTableResult;

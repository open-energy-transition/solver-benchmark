import React, { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Color } from "@/constants/color";
import { MetaDataEntry } from "@/types/meta-data";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import { filterSelect } from "@/utils/table";
import { TanStackTable } from "@/components/shared/tables/TanStackTable";
import { FilterIcon } from "@/assets/icons";
import InfoPopup from "@/components/common/InfoPopup";

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
}

const BenchmarkTableResult: React.FC<BenchmarkTableResultProps> = ({
  metaData,
}) => {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<Set<string>>(
    new Set(),
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    currentFile: string;
  } | null>(null);

  const memoizedMetaData = useMemo(
    () =>
      Object.entries(metaData).map(([key, value]) => ({
        ...value,
        name: key,
      })),
    [metaData],
  );

  const handleSelectAll = () => {
    if (selectedBenchmarks.size === memoizedMetaData.length) {
      setSelectedBenchmarks(new Set());
    } else {
      setSelectedBenchmarks(new Set(memoizedMetaData.map((b) => b.name)));
    }
  };

  const handleToggleSelect = (name: string) => {
    const newSelected = new Set(selectedBenchmarks);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedBenchmarks(newSelected);
  };

  const handleDownloadSelected = async () => {
    if (selectedBenchmarks.size === 0) {
      alert("Please select at least one benchmark to download");
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
        selectedBenchmarks.has(b.name),
      );

      setDownloadProgress({
        current: 0,
        total: selectedFiles.length,
        currentFile: "",
      });

      for (let i = 0; i < selectedFiles.length; i++) {
        const benchmark = selectedFiles[i];

        // Find the first size with a valid URL
        const sizeWithUrl = benchmark.sizes?.find(
          (s: { url?: string }) => s.url,
        );
        const url = sizeWithUrl?.url;
        console.log("url", url);
        if (!url) {
          console.warn(`No download URL found for ${benchmark.name}`);
          alert(`No download URL found for ${benchmark.name}. Skipping...`);
          continue;
        }

        // Extract filename from URL or use benchmark name
        const urlParts = url.split("/");
        const filename =
          urlParts[urlParts.length - 1] || `${benchmark.name}.lp`;

        setDownloadProgress({
          current: i + 1,
          total: selectedFiles.length,
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
      setSelectedBenchmarks(new Set());
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
    setSelectedBenchmarks(new Set());
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
                      selectedBenchmarks.size === memoizedMetaData.length &&
                      memoizedMetaData.length > 0
                    }
                    onChange={handleSelectAll}
                    className="cursor-pointer w-4 h-4"
                  />
                </div>
              ),
              cell: (info: { row: { original: IColumnTable } }) => (
                <div>
                  <input
                    type="checkbox"
                    checked={selectedBenchmarks.has(info.row.original.name)}
                    onChange={() => handleToggleSelect(info.row.original.name)}
                    className="cursor-pointer w-4 h-4"
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
        header: "BENCHMARK NAME",
        accessorKey: "name",
        size: 230,
        enableSorting: true,
        filterFn: filterSelect,
        cell: (info) => (
          <Link
            className="font-bold inline-block"
            style={{ lineHeight: "1.5" }}
            href={PATH_DASHBOARD.benchmarkSet.one.replace(
              "{name}",
              info.row.original.name,
            )}
          >
            <InfoPopup
              disabled={((info.getValue() as string) || "").length <= 30}
              trigger={() => (
                <div className="w-52 whitespace-nowrap text-ellipsis overflow-hidden">
                  {info.getValue() as string}
                </div>
              )}
              position="top center"
              closeOnDocumentClick
              arrowStyle={{ color: Color.Stroke }}
            >
              <div> {info.getValue() as string} </div>
            </InfoPopup>
          </Link>
        ),
      },
      {
        header: "MODEL NAME",
        accessorKey: "modelName",
        filterFn: filterSelect,
        cell: (info) => info.getValue(),
        size: 180,
      },
      {
        header: "PROBLEM CLASS",
        accessorKey: "problemClass",
        filterFn: filterSelect,
        size: 180,
        cell: (info) => info.getValue(),
      },
      {
        header: "APPLICATION",
        accessorKey: "application",
        filterFn: filterSelect,
        size: 200,
        cell: (info) => (
          <InfoPopup
            disabled={((info.getValue() as string) || "").length <= 30}
            trigger={() => (
              <div className="pl-4 w-40 whitespace-nowrap text-ellipsis overflow-hidden">
                {info.getValue() as string}
              </div>
            )}
            position="top center"
            closeOnDocumentClick
            arrowStyle={{ color: Color.Stroke }}
          >
            <div> {info.getValue() as string} </div>
          </InfoPopup>
        ),
      },
      {
        header: "SECTORAL FOCUS",
        accessorKey: "sectoralFocus",
        size: 200,
        filterFn: filterSelect,
        cell: (info) => info.getValue(),
      },
      {
        header: "SECTORS",
        accessorKey: "sectors",
        size: 150,
        filterFn: filterSelect,
        cell: (info) => (
          <InfoPopup
            trigger={() => (
              <div className="w-52 whitespace-nowrap text-ellipsis overflow-hidden">
                {info.getValue() as string}
              </div>
            )}
            position="top center"
            disabled={((info.getValue() as string) || "").length <= 30}
            closeOnDocumentClick
            arrowStyle={{ color: Color.Stroke }}
          >
            <div> {info.getValue() as string} </div>
          </InfoPopup>
        ),
      },
    ],
    [isSelectMode, selectedBenchmarks, memoizedMetaData.length],
  );

  return (
    <div>
      <div className="flex items-center justify-between my-4 md:mt-0">
        <p className="text-xs w-1/2 4xl:w-3/4">
          <span>
            To search for a particular benchmark problem by name, click the
            filter icon
          </span>
          <span className="inline-flex gap-2">
            <FilterIcon className="size-4 shrink-0" />
          </span>
          <span>on the benchmark name column and type to search</span>
        </p>

        <div className="flex gap-2">
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
                disabled={isDownloading || selectedBenchmarks.size === 0}
                className="px-4 py-2 bg-navy text-white rounded-lg transition-colors text-sm font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isDownloading
                  ? `Downloading... (${downloadProgress?.current || 0}/${
                      downloadProgress?.total || 0
                    })`
                  : `Download Selected (${selectedBenchmarks.size})`}
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
        <TanStackTable showAllRows data={memoizedMetaData} columns={columns} />
      </div>
      <div>
        <div className="text-xs my-4">
          <div className="text-dark-grey tag-line-xxs">
            Showing {memoizedMetaData.length} benchmark problems matching the
            filters
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkTableResult;

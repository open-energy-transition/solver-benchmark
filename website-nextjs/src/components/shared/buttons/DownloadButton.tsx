import React from "react"

interface DownloadButtonProps {
  children: React.ReactNode
  url: string,
  fileName: string,
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ children, url, fileName }) => {
  const handleDownload = async () => {
    const fileUrl = url

    try {
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const blob = await response.blob()

      const blobUrl = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = blobUrl
      link.setAttribute("download", fileName)

      document.body.appendChild(link)

      link.click()

      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  return <div onClick={handleDownload}>{children}</div>
}

export default DownloadButton

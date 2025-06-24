"use client";

import { useRef } from "react";
import { toSvg } from "html-to-image";

export default function TreeModal({
  children,
  onClose,
  theme,
  exportFileName,
}: {
  children: React.ReactNode;
  onClose: () => void;
  theme: string;
  exportFileName: string;
}) {
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    const node = exportRef.current;
    if (!node) return;

    // Temporarily expand full height and allow overflow for SVG rendering
    const originalStyle = {
      maxHeight: node.style.maxHeight,
      overflow: node.style.overflow,
    };
    node.style.maxHeight = "none";
    node.style.overflow = "visible";

    await new Promise((r) => requestAnimationFrame(r));

    try {
      const raw = await toSvg(node, {
        backgroundColor: getThemeColor(theme),
      });

      let svgString = raw;
      if (raw.startsWith("data:image/svg+xml")) {
        const commaIndex = raw.indexOf(",");
        svgString = decodeURIComponent(raw.slice(commaIndex + 1));
      }

      if (!svgString.trim().startsWith("<svg")) {
        throw new Error("Invalid SVG output");
      }

      const blob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = exportFileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Export failed:", err);
      alert("Export failed. See console.");
    } finally {
      node.style.maxHeight = originalStyle.maxHeight;
      node.style.overflow = originalStyle.overflow;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
      <div
        className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg shadow-lg border"
        style={{
          backgroundColor: getThemeColor(theme),
          color: getThemeTextColor(theme),
          fontFamily: "monospace",
        }}
      >
        {/* Header with close + export */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-300 bg-opacity-30 backdrop-blur-sm">
          <h2 className="font-bold text-lg truncate">{exportFileName}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm"
            >
              Export as SVG
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-black px-3 py-1 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tree content */}
        <div
          ref={exportRef}
          className="p-4 overflow-auto"
          style={{
            maxHeight: "calc(90vh - 3.5rem)",
            whiteSpace: "pre",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function getThemeColor(theme: string): string {
  switch (theme) {
    case "theme-terminal":
      return "#000000";
    case "theme-light":
      return "#ffffff";
    case "theme-dark":
      return "#1a1a1a";
    case "theme-blueprint":
      return "#002b36";
    default:
      return "#ffffff";
  }
}

function getThemeTextColor(theme: string): string {
  switch (theme) {
    case "theme-terminal":
      return "#00FF00";
    case "theme-light":
      return "#000000";
    case "theme-dark":
      return "#ffffff";
    case "theme-blueprint":
      return "#93a1a1";
    default:
      return "#000000";
  }
}

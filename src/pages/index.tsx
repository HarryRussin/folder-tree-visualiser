"use client";

import { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import Tree, { TreeNode } from "../components/Tree";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { toSvg } from "html-to-image";

export default function Home() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [theme, setTheme] = useState("theme-terminal");
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportTarget, setExportTarget] = useState<"tree" | "ascii">("tree");

  const treeRef = useRef<HTMLDivElement>(null);
  const asciiRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    // Prevent hydration issues on client side
    setMounted(true);
  }, []);
  const [mounted, setMounted] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith(".zip")) return;

    const zip = await JSZip.loadAsync(file);
    const root: TreeNode = { name: "root", children: [] };
    const pathMap: { [path: string]: TreeNode } = { "": root };

    zip.forEach((relativePath) => {
      const parts = relativePath.split("/").filter(Boolean);
      parts.reduce((acc, part, index) => {
        const currentPath = parts.slice(0, index + 1).join("/");
        if (!pathMap[currentPath]) {
          const isFile = index === parts.length - 1;
          const newNode: TreeNode = {
            name: part,
            children: isFile ? undefined : [],
          };
          if (acc.children) acc.children.push(newNode);
          pathMap[currentPath] = newNode;
        }
        return pathMap[currentPath];
      }, root);
    });

    setTree(root);
  };

  const handleExport = async () => {
    const node =
      exportTarget === "tree" ? treeRef.current : asciiRef.current;

    if (!node) {
      console.error("❌ exportRef is null");
      return;
    }

    const filename =
      exportTarget === "tree" ? "visual-tree.svg" : "ascii-tree.svg";

    try {
      console.log("✅ Exporting node:", node);

      await new Promise((res) => setTimeout(res, 100)); // Small delay to ensure render

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
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Export failed:", err);
      alert("Export failed. See console.");
    }
  };

  function getInlineStyle(theme: string): React.CSSProperties {
    switch (theme) {
      case "theme-terminal":
        return {
          backgroundColor: "#000000",
          color: "#00FF00",
          fontFamily: "monospace",
        };
      case "theme-light":
        return {
          backgroundColor: "#ffffff",
          color: "#000000",
          fontFamily: "monospace",
        };
      case "theme-dark":
        return {
          backgroundColor: "#1a1a1a",
          color: "#ffffff",
          fontFamily: "monospace",
        };
      case "theme-blueprint":
        return {
          backgroundColor: "#002b36",
          color: "#93a1a1",
          fontFamily: "monospace",
        };
      default:
        return {
          backgroundColor: "#ffffff",
          color: "#000000",
          fontFamily: "monospace",
        };
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gradient-to-b from-white to-gray-100">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="text-center my-8 max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Folder Tree Visualizer</h1>
          <p className="text-gray-700 dark:text-gray-300">
            Upload a ZIP file containing your project folder. Visualize its
            structure as a clean tree diagram or an ASCII representation. You
            can export the view as a themed PNG for documentation, sharing, or
            personal reference.
          </p>
        </header>

        <div className="flex justify-center items-center gap-4">
          <label className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded cursor-pointer">
            Upload ZIP
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              onChange={handleUpload}
              className="hidden"
            />
          </label>

          <ThemeSwitcher theme={theme} setTheme={setTheme} />
        </div>

        {tree && (
          <>
            <div className="flex flex-col md:flex-row gap-4 border p-4 rounded max-h-[70vh] overflow-auto">
              <div
                ref={treeRef}
                className={`flex-1 p-4 rounded ${theme}`}
                style={{
                  minWidth: "50%",
                  ...getInlineStyle(theme),
                }}
              >
                <Tree
                  node={tree}
                  theme={theme}
                  inlineStyle={getInlineStyle(theme)}
                />
              </div>
              <pre
                ref={asciiRef}
                className={`flex-1 p-4 overflow-auto rounded ${theme}`}
                style={{
                  minWidth: "50%",
                  ...getInlineStyle(theme),
                }}
              >
                {generateAsciiTree(tree)}
              </pre>
            </div>

            <div className="flex items-center gap-4 justify-center my-4">
              <select
                value={exportTarget}
                onChange={(e) =>
                  setExportTarget(e.target.value as "tree" | "ascii")
                }
                className="border px-3 py-1 rounded"
              >
                <option value="tree">Export Visual Tree</option>
                <option value="ascii">Export ASCII Tree</option>
              </select>

              <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Export as SVG
              </button>
            </div>
          </>
        )}
      </div>

      <footer className="text-center mt-8 mb-4 text-sm text-gray-500">
        Made with ❤️ —{" "}
        <a
          href="https://www.buymeacoffee.com/yourusername"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Buy me a coffee
        </a>
      </footer>
    </main>
  );
}

function generateAsciiTree(node: TreeNode, prefix = "", isRoot = true): string {
  const lines: string[] = [];
  if (!isRoot) lines.push(prefix + node.name);
  if (node.children) {
    const lastIndex = node.children.length - 1;
    node.children.forEach((child, i) => {
      const isLast = i === lastIndex;
      const connector = isLast ? "└── " : "├── ";
      const nextPrefix = prefix + (isLast ? "    " : "│   ");
      lines.push(prefix + connector + child.name);
      if (child.children) {
        lines.push(generateAsciiTree(child, nextPrefix, false));
      }
    });
  }
  return lines.join("\n");
}


function getThemeColor(theme: string) {
  if (theme === "theme-terminal") return "#000000";
  if (theme === "theme-light") return "#ffffff";
  if (theme === "theme-dark") return "#1a1a1a";
  if (theme === "theme-blueprint") return "#002b36";
  return "#ffffff";
}

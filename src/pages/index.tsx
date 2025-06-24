"use client";

import { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import Tree, { TreeNode } from "../components/Tree";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { toSvg } from "html-to-image";
import VerticalTree from "../components/VerticalTree";
import TreeModal from "@/components/TreeModal";

export default function Home() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [theme, setTheme] = useState("theme-terminal");
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportTarget, setExportTarget] = useState<"tree" | "ascii">("tree");
  const treeRef = useRef<HTMLDivElement>(null);
  const asciiRef = useRef<HTMLPreElement>(null);
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [customBlacklist, setCustomBlacklist] = useState<string>("");
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(
    null
  );
  const [modalTitle, setModalTitle] = useState("");

  const combinedBlacklist = [
    "node_modules",
    ".git",
    ".vscode",
    ...customBlacklist
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ];

  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
    new Set()
  );

  const toggleFolder = (path: string) => {
    setCollapsedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith(".zip")) return;

    const zip = await JSZip.loadAsync(file);
    const root: TreeNode = { name: "", children: [] };
    const pathMap: { [path: string]: TreeNode } = { "": root };

    const blacklist = combinedBlacklist;

    zip.forEach((relativePath, file) => {
      const parts = relativePath.split("/").filter(Boolean);
      if (parts.some((part) => blacklist.includes(part))) return;

      parts.reduce((acc, part, index) => {
        const currentPath = parts.slice(0, index + 1).join("/");
        const isFile = index === parts.length - 1 && !file.dir;

        if (!pathMap[currentPath]) {
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

    const children = root.children || [];
    const actualRoot =
      children.length === 1 && children[0].children
        ? children[0]
        : { name: "root", children };

    setTree(actualRoot);
  };

  const handleExport = async () => {
    const node = exportTarget === "tree" ? treeRef.current : asciiRef.current;
    if (!node) return;

    const filename =
      exportTarget === "tree" ? "visual-tree.svg" : "ascii-tree.svg";

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
            structure as a clean tree diagram or an ASCII representation. Export
            as SVG for docs or sharing.
          </p>
        </header>
        <section className="mt-6 text-gray-700 dark:text-gray-300">
  <h2 className="text-xl font-semibold mb-2">How to Use</h2>
  <ul className="list-disc list-inside space-y-1">
    <li>Click on folder names to expand or collapse them directly in the tree view.</li>
    <li>Click on the tree or ASCII view to open a larger modal view.</li>
    <li>Use the export button to download the current view as an SVG file.</li>
  </ul>
</section>


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
            <>
              <div className="flex flex-col md:flex-row gap-4 border p-4 rounded max-h-[65vh] overflow-auto">
                <div
                  onClick={() => {
                    setModalContent(
                      <Tree
                        node={tree}
                        theme={theme}
                        inlineStyle={getInlineStyle(theme)}
                        collapsedMap={Object.fromEntries(
                        Array.from(collapsedFolders).map((path) => [path, true])
                      )}
                        toggleCollapse={toggleFolder}
                      />
                    );
                    setModalTitle("visual-tree");
                  }}
                  className="cursor-pointer basis-1/2 min-w-0 rounded overflow-auto"
                  ref={treeRef}
                  style={getInlineStyle(theme)}
                >
                  <div className="p-4">
                    <Tree
                      node={tree}
                      theme={theme}
                      inlineStyle={getInlineStyle(theme)}
                      collapsedMap={Object.fromEntries(
                        Array.from(collapsedFolders).map((path) => [path, true])
                      )}
                      toggleCollapse={toggleFolder}
                    />
                  </div>
                </div>

                <pre
                  onClick={() => {
                    setModalContent(
                      <pre style={getInlineStyle(theme)}>
                        {generateAsciiTree(
                          tree,
                          Object.fromEntries(
                            Array.from(collapsedFolders).map((p) => [p, true])
                          )
                        )}
                      </pre>
                    );
                    setModalTitle("ascii-tree");
                  }}
                  ref={asciiRef}
                  className={`cursor-pointer basis-1/2 min-w-0 rounded overflow-auto ${theme}`}
                  style={{ ...getInlineStyle(theme), padding: "1rem" }}
                >
                  {generateAsciiTree(
                    tree,
                    Object.fromEntries(
                      [...collapsedFolders].map((p) => [p, true])
                    )
                  )}
                </pre>
              </div>

              <div
                onClick={() => {
                  setModalContent(<VerticalTree node={tree} theme={theme} collapsedMap={Object.fromEntries(
      Array.from(collapsedFolders).map((path) => [path, true])
    )} />);
                  setModalTitle("vertical-tree");
                }}
                className="border p-4 rounded bg-white shadow-inner cursor-pointer"
              >
                <div className="mt-8 overflow-auto max-w-full">
                  <VerticalTree
                    node={tree}
                    theme={theme}
                    collapsedMap={Object.fromEntries(
                      Array.from(collapsedFolders).map((path) => [path, true])
                    )}
                  />
                </div>
              </div>
            </>

            <div className="flex items-center gap-4 justify-center my-4 flex-wrap">
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
      {modalContent && (
        <TreeModal
          theme={theme}
          onClose={() => setModalContent(null)}
          exportFileName={`${modalTitle}.svg`}
        >
          {modalContent}
        </TreeModal>
      )}

      <footer className="text-center mt-8 mb-4 text-sm text-gray-500">
        Made with ❤️ —{" "}
        <a
          href="https://www.buymeacoffee.com/russinharri"
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

export function generateAsciiTree(
  node: TreeNode,
  collapsedMap: Record<string, boolean>,
  prefix = "",
  isRoot = true,
  path = ""
): string {
  const lines: string[] = [];
  const fullPath = path ? `${path}/${node.name}` : node.name;
  if (!isRoot) lines.push(prefix + node.name);
  if (node.children && !collapsedMap[fullPath]) {
    const lastIndex = node.children.length - 1;
    node.children.forEach((child, i) => {
      const isLast = i === lastIndex;
      const connector = isLast ? "└── " : "├── ";
      const nextPrefix = prefix + (isLast ? "    " : "│   ");
      lines.push(prefix + connector + child.name);
      if (child.children) {
        lines.push(
          generateAsciiTree(child, collapsedMap, nextPrefix, false, fullPath)
        );
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

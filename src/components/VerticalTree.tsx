import React from "react";
import { TreeNode } from "./Tree";

interface VerticalTreeProps {
  node: TreeNode;
  theme: string;
  collapsedMap: Record<string, boolean>;
  path?: string;
}

const THEME_MAP = {
  "theme-terminal": {
    containerBg: "#000000",
    containerText: "#00FF00",
    lineClass: "bg-green-500",
    boxClass: "bg-black text-green-500 border-green-500",
  },
  "theme-light": {
    containerBg: "#ffffff",
    containerText: "#000000",
    lineClass: "bg-black",
    boxClass: "bg-white text-black border-black",
  },
  "theme-dark": {
    containerBg: "#1a1a1a",
    containerText: "#ffffff",
    lineClass: "bg-white",
    boxClass: "bg-zinc-900 text-white border-white",
  },
  "theme-blueprint": {
    containerBg: "#002b36",
    containerText: "#93a1a1",
    lineClass: "bg-cyan-400",
    boxClass: "bg-[#073642] text-[#93a1a1] border-cyan-400",
  },
};

const getThemeStyles = (theme: string) => {
  const fallback = THEME_MAP["theme-light"];
//   @ts-ignore
  const selected = THEME_MAP[theme] || fallback;

  return {
    container: {
      backgroundColor: selected.containerBg,
      color: selected.containerText,
      fontFamily: "monospace",
      minHeight: "60vh",
    },
    line: selected.lineClass,
    box: selected.boxClass,
  };
};

const VerticalTree: React.FC<VerticalTreeProps> = ({
  node,
  theme,
  collapsedMap,
  path = "",
}) => {
  const styles = getThemeStyles(theme);

  return (
    <div
      className="py-8 px-4 overflow-x-auto rounded w-full"
      style={styles.container}
    >
      <div className="flex justify-center min-w-fit">
        <div className="flex flex-col items-center font-mono text-sm">
          <TreeBlock
            node={node}
            lineClass={styles.line}
            boxClass={styles.box}
            collapsedMap={collapsedMap}
            path={path}
          />
        </div>
      </div>
    </div>
  );
};

const TreeBlock: React.FC<{
  node: TreeNode;
  lineClass: string;
  boxClass: string;
  collapsedMap: Record<string, boolean>;
  path: string;
}> = ({ node, lineClass, boxClass, collapsedMap, path }) => {
  const hasChildren = node.children && node.children.length > 0;
  const fullPath = path ? `${path}/${node.name}` : node.name;
  const isCollapsed = collapsedMap[fullPath];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`px-3 py-1 border rounded ${boxClass} whitespace-nowrap text-center`}
      >
        [{node.name}]
      </div>

      {hasChildren && !isCollapsed && (
        <>
          <div className={`w-px h-4 ${lineClass}`} />

          <div className="flex items-center justify-center relative mb-1 w-full">
            <div className="text-xs -mt-1">┌</div>
            <div className={`h-px flex-grow mx-1 ${lineClass}`} />
            <div className="text-xs -mt-1">┴</div>
            <div className={`h-px flex-grow mx-1 ${lineClass}`} />
            <div className="text-xs -mt-1">┐</div>
          </div>

          <div className="flex justify-center gap-4">
            {node.children!.map((child, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className={`w-px h-4 ${lineClass}`} />
                <TreeBlock
                  node={child}
                  lineClass={lineClass}
                  boxClass={boxClass}
                  collapsedMap={collapsedMap}
                  path={fullPath}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default VerticalTree;

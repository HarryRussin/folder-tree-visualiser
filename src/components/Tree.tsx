"use client";
import React from "react";
import { Folder, FileText, ChevronRight, ChevronDown } from "lucide-react";

export interface TreeNode {
  name: string;
  children?: TreeNode[];
}

interface TreeProps {
  node: TreeNode;
  depth?: number;
  theme: string;
  inlineStyle?: React.CSSProperties;
  collapsedMap: Record<string, boolean>;
  toggleCollapse: (path: string) => void;
  path?: string;
}

export default function Tree({
  node,
  depth = 0,
  theme,
  inlineStyle = {},
  collapsedMap,
  toggleCollapse,
  path = "",
}: TreeProps) {
  const isFile = !node.children;
  const fullPath = path ? `${path}/${node.name}` : node.name;
  const paddingLeft = depth * 16;
  const isCollapsed = collapsedMap[fullPath];

  return (
    <div style={{ paddingLeft }}>
      <span
        className="flex items-center gap-2 cursor-pointer"
        style={inlineStyle}
        onClick={(e:any) => {
        e.stopPropagation();
          if (!isFile) toggleCollapse(fullPath);

        }}
      >
        {isFile ? (
          <FileText className="w-4 h-4" />
        ) : isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        <span>{node.name}</span>
      </span>

      {!isFile &&
        !isCollapsed &&
        node.children?.map((child, index) => (
          <Tree
            key={`${child.name}-${index}`}
            node={child}
            depth={depth + 1}
            theme={theme}
            inlineStyle={inlineStyle}
            collapsedMap={collapsedMap}
            toggleCollapse={toggleCollapse}
            path={fullPath}
          />
        ))}
    </div>
  );
}

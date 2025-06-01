import React from "react";
import { Folder, FileText } from "lucide-react";

export interface TreeNode {
  name: string;
  children?: TreeNode[];
}

interface TreeProps {
  node: TreeNode;
  depth?: number;
  theme: string;
  inlineStyle?: React.CSSProperties;
}

export default function Tree({
  node,
  depth = 0,
  theme,
  inlineStyle = {},
}: TreeProps) {
  const isFile = !node.children;
  const paddingLeft = depth * 16;

  return (
    <div style={{ paddingLeft }}>
      <div className="flex items-center gap-2" style={inlineStyle}>
        {isFile ? (
          <FileText className="w-4 h-4" />
        ) : (
          <Folder className="w-4 h-4" />
        )}
        <span>{node.name}</span>
      </div>
      {!isFile &&
        node.children?.map((child, index) => (
          <Tree
            key={`${child.name}-${index}`}
            node={child}
            depth={depth + 1}
            theme={theme}
            inlineStyle={inlineStyle}
          />
        ))}
    </div>
  );
}

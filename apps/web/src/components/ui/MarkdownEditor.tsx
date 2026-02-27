"use client";

import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const MDPreview = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
  { ssr: false },
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  height = 200,
  placeholder,
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        height={height}
        preview="edit"
        textareaProps={{ placeholder }}
      />
    </div>
  );
}

interface MarkdownPreviewProps {
  source: string;
}

export function MarkdownPreview({ source }: MarkdownPreviewProps) {
  return (
    <div data-color-mode="light">
      <MDPreview source={source} />
    </div>
  );
}

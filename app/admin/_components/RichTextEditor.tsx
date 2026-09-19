"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  { ssr: false, loading: () => <div className="h-96 bg-slate-700 rounded animate-pulse" /> }
);

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      value={value}
      onEditorChange={onChange}
      init={{
        height: 400,
        menubar: false,
        skin: "oxide-dark",
        content_css: "dark",
        plugins: [
          "advlist", "autolink", "lists", "link", "image",
          "charmap", "preview", "anchor", "searchreplace",
          "visualblocks", "code", "fullscreen", "insertdatetime",
          "media", "table", "help", "wordcount",
        ],
        toolbar:
          "undo redo | blocks | bold italic underline strikethrough | " +
          "bullist numlist | outdent indent | link | removeformat | code | help",
        content_style:
          "body { font-family: Arial, sans-serif; font-size: 14px; background: #1e293b; color: #e2e8f0; }",
      }}
    />
  );
}

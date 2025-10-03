"use client";

import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Editor } from "@toast-ui/react-editor";
import { useTheme } from "next-themes";
import "@toast-ui/editor/dist/toastui-editor.css";
import "@toast-ui/editor/dist/theme/toastui-editor-dark.css";

interface TuiEditorProps {
  initialValue?: string;
  height?: string;
  placeholder?: string;
  onChange?: (content: string) => void;
}

export interface TuiEditorRef {
  getMarkdown: () => string;
  setMarkdown: (content: string) => void;
}

const TuiEditor = forwardRef<TuiEditorRef, TuiEditorProps>(
  ({ initialValue = "", height = "400px", placeholder, onChange }, ref) => {
    const editorRef = useRef<Editor>(null);
    const { theme, resolvedTheme } = useTheme();
    const isDark = theme === "dark" || resolvedTheme === "dark";

    useImperativeHandle(ref, () => ({
      getMarkdown: () => {
        return editorRef.current?.getInstance().getMarkdown() || "";
      },
      setMarkdown: (content: string) => {
        editorRef.current?.getInstance().setMarkdown(content);
      },
    }));

    const handleChange = () => {
      if (onChange && editorRef.current) {
        const content = editorRef.current.getInstance().getMarkdown();
        onChange(content);
      }
    };

    useEffect(() => {
      // Apply theme to editor after it's mounted
      const applyTheme = () => {
        // Target the entire editor container including toolbar
        const editorContainer = document.querySelector(
          ".toastui-editor-defaultUI"
        );
        const editorEl = document.querySelector(".toastui-editor");
        const toolbar = document.querySelector(".toastui-editor-toolbar");

        if (editorContainer) {
          if (isDark) {
            editorContainer.classList.add("toastui-editor-dark");
          } else {
            editorContainer.classList.remove("toastui-editor-dark");
          }
        }

        if (editorEl) {
          if (isDark) {
            editorEl.classList.add("toastui-editor-dark");
          } else {
            editorEl.classList.remove("toastui-editor-dark");
          }
        }

        if (toolbar) {
          if (isDark) {
            toolbar.classList.add("toastui-editor-dark");
          } else {
            toolbar.classList.remove("toastui-editor-dark");
          }
        }
      };

      // Apply theme immediately and after a short delay to ensure editor is rendered
      applyTheme();
      const timeout = setTimeout(applyTheme, 100);
      const interval = setInterval(applyTheme, 500); // Check periodically

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }, [isDark]);

    return (
      <div
        className={`border rounded-md overflow-hidden ${
          isDark ? "tui-editor-dark-wrapper" : "tui-editor-light-wrapper"
        }`}
      >
        <Editor
          ref={editorRef}
          initialValue={initialValue}
          placeholder={placeholder}
          height={height}
          initialEditType="wysiwyg"
          previewStyle="vertical"
          hideModeSwitch={true}
          useCommandShortcut={true}
          usageStatistics={false}
          onChange={handleChange}
          theme={isDark ? "dark" : "default"}
          toolbarItems={[
            ["heading", "bold", "italic", "strike"],
            ["hr", "quote"],
            ["ul", "ol", "task", "indent", "outdent"],
            ["table", "link"],
            ["code", "codeblock"],
          ]}
        />
      </div>
    );
  }
);

TuiEditor.displayName = "TuiEditor";

export { TuiEditor };

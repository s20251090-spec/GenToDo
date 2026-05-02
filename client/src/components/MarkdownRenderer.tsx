import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold mt-6 mb-4 text-gray-900" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold mt-5 mb-3 text-gray-800" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-bold mt-4 mb-2 text-gray-700" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-lg font-bold mt-3 mb-2 text-gray-700" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-base font-bold mt-2 mb-1 text-gray-700" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-sm font-bold mt-2 mb-1 text-gray-700" {...props} />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="my-3 text-gray-800 leading-relaxed" {...props} />
          ),

          // Bold
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-gray-900" {...props} />
          ),

          // Italic
          em: ({ node, ...props }) => (
            <em className="italic text-gray-800" {...props} />
          ),

          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 hover:text-blue-700 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Code
          code: ({ node, inline, className, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="bg-gray-100 text-red-600 px-2 py-1 rounded font-mono text-sm"
                  {...props}
                />
              );
            }
            return <code className={className} {...props} />;
          },

          // Code blocks
          pre: ({ node, ...props }) => (
            <pre
              className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 font-mono text-sm"
              {...props}
            />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside my-3 ml-4 space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside my-3 ml-4 space-y-1" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-gray-800" {...props} />
          ),

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-blue-600 pl-4 my-4 text-gray-700 italic bg-blue-50 py-2 pr-4 rounded"
              {...props}
            />
          ),

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-t-2 border-gray-300" {...props} />
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table
                className="w-full border-collapse border border-gray-300"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="border border-gray-300" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-900 bg-gray-100"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-gray-300 px-4 py-2 text-gray-800" {...props} />
          ),

          // Images
          img: ({ node, ...props }) => (
            <img className="max-w-full h-auto rounded-lg my-4" {...props} />
          ),

          // Strikethrough (from GFM)
          del: ({ node, ...props }) => (
            <del className="line-through text-gray-600" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Add global styles for markdown content
const markdownStyles = `
.markdown-content {
  font-family: inherit;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
}

.markdown-content code {
  font-family: 'Monaco', 'Courier New', monospace;
}

.markdown-content pre code {
  background: none;
  color: inherit;
  padding: 0;
}

.markdown-content .hljs {
  background: #f5f5f5;
  padding: 0;
}

.markdown-content .katex-display {
  overflow-x: auto;
  overflow-y: hidden;
}
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = markdownStyles;
  document.head.appendChild(styleSheet);
}

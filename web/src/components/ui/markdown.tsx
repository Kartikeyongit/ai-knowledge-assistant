"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import type { Components } from "react-markdown";

const components: Components = {
  h1({ children }) {
    return <h1 className="text-2xl font-bold tracking-tight mb-4 mt-6 first:mt-0">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-xl font-semibold tracking-tight mb-3 mt-5 first:mt-0 pb-1 border-b border-neutral-200 dark:border-neutral-700">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="text-lg font-semibold tracking-tight mb-2 mt-4 first:mt-0">{children}</h3>;
  },
  h4({ children }) {
    return <h4 className="text-base font-medium mb-1 mt-3 first:mt-0 text-neutral-700 dark:text-neutral-300">{children}</h4>;
  },
  p({ children }) {
    return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
  },
  ul({ children }) {
    return <ul className="list-disc pl-5 mb-3 space-y-1.5 last:mb-0 marker:text-neutral-400">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal pl-5 mb-3 space-y-1.5 last:mb-0 marker:text-neutral-400">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-relaxed pl-1">{children}</li>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-4 border-indigo-400 dark:border-indigo-500 pl-4 py-1.5 my-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-r-lg text-neutral-600 dark:text-neutral-400 italic">
        {children}
      </blockquote>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-sm">
          {children}
        </table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-neutral-100 dark:bg-neutral-800">{children}</thead>;
  },
  tbody({ children }) {
    return <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">{children}</tbody>;
  },
  tr({ children }) {
    return <tr>{children}</tr>;
  },
  th({ children }) {
    return <th className="px-4 py-2.5 text-left font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">{children}</th>;
  },
  td({ children }) {
    return <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{children}</td>;
  },
  hr() {
    return <hr className="my-4 border-neutral-200 dark:border-neutral-700" />;
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-300 dark:decoration-indigo-600 underline-offset-2 hover:decoration-indigo-600 dark:hover:decoration-indigo-300 transition-colors"
      >
        {children}
      </a>
    );
  },
  strong({ children }) {
    return <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic text-neutral-700 dark:text-neutral-300">{children}</em>;
  },

};

export function Markdown({ content }: { content: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const themedComponents: Components = {
    ...components,
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeString = String(children).replace(/\n$/, "");
      if (match) {
        return (
          <div className="my-3 rounded-lg overflow-hidden border border-neutral-700">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-neutral-800 text-neutral-400 text-xs font-mono border-b border-neutral-700">
              <span className="size-2.5 rounded-full bg-red-500/80" />
              <span className="size-2.5 rounded-full bg-yellow-500/80" />
              <span className="size-2.5 rounded-full bg-green-500/80" />
              <span className="ml-2">{match[1]}</span>
            </div>
            <SyntaxHighlighter
              style={isDark ? oneDark : oneLight}
              language={match[1]}
              PreTag="div"
              customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.8125rem", lineHeight: "1.5" }}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      }
      return (
        <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400 border border-neutral-200 dark:border-neutral-700" {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 space-y-0">
      <ReactMarkdown components={themedComponents}>{content}</ReactMarkdown>
    </div>
  );
}

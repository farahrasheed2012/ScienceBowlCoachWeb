import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function isTableRow(line: string) {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

function isDivider(line: string) {
  return /^\|?\s*:?-{3,}/.test(line.trim());
}

export function PythonBody({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const fence: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        fence.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push(<pre key={key}><code>{fence.join("\n")}</code></pre>);
      key += 1;
      continue;
    }
    if (isTableRow(line)) {
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        if (!isDivider(lines[i])) {
          rows.push(lines[i].slice(1, -1).split("|").map((cell) => cell.trim()));
        }
        i += 1;
      }
      if (rows.length) {
        const [head, ...body] = rows;
        blocks.push(
          <table key={key}>
            <thead>
              <tr>{head.map((cell, idx) => <th key={idx}>{inline(cell)}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((row, ridx) => (
                <tr key={ridx}>{row.map((cell, cidx) => <td key={cidx}>{inline(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>,
        );
        key += 1;
      }
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(<h3 key={key}>{inline(line.slice(4))}</h3>);
      key += 1;
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(<h2 key={key}>{inline(line.slice(3))}</h2>);
      key += 1;
      i += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(<h2 key={key}>{inline(line.slice(2))}</h2>);
      key += 1;
      i += 1;
      continue;
    }
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*] /, ""));
        i += 1;
      }
      blocks.push(
        <ul key={key}>
          {items.map((item, idx) => <li key={idx}>{inline(item)}</li>)}
        </ul>,
      );
      key += 1;
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i += 1;
      }
      blocks.push(
        <ol key={key}>
          {items.map((item, idx) => <li key={idx}>{inline(item)}</li>)}
        </ol>,
      );
      key += 1;
      continue;
    }
    blocks.push(<p key={key}>{inline(line)}</p>);
    key += 1;
    i += 1;
  }

  return <div className="python-body">{blocks}</div>;
}

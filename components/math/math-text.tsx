import katex from "katex";
import { Fragment, type ReactNode } from "react";

export function MathText({ children, className }: { children: string; className?: string }) {
  const paragraphs = children.split(/\n{2,}/);

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph}`}>{renderParagraph(paragraph)}</p>
      ))}
    </div>
  );
}

const delimiters = [
  { left: "$$", right: "$$", display: true },
  { left: "\\[", right: "\\]", display: true },
  { left: "$", right: "$", display: false },
  { left: "\\(", right: "\\)", display: false }
];

function renderParagraph(paragraph: string) {
  return parseMathSegments(paragraph).flatMap((segment, index) => {
    if (segment.type === "math") {
      return (
        <span
          key={index}
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(segment.value, {
              displayMode: segment.display,
              throwOnError: false
            })
          }}
        />
      );
    }

    return renderTextWithLineBreaks(segment.value, index);
  });
}

function renderTextWithLineBreaks(value: string, keyPrefix: number) {
  return value.split("\n").map<ReactNode>((line, index) => (
    <Fragment key={`${keyPrefix}-${index}`}>
      {index > 0 && <br />}
      {line}
    </Fragment>
  ));
}

export function parseMathSegments(value: string) {
  const segments: Array<{ type: "text"; value: string } | { type: "math"; value: string; display: boolean }> = [];
  let index = 0;
  const pushText = (text: string) => {
    const previous = segments.at(-1);
    if (previous?.type === "text") {
      previous.value += text;
      return;
    }
    segments.push({ type: "text", value: text });
  };

  while (index < value.length) {
    const next = findNextDelimiter(value, index);

    if (!next) {
      pushText(value.slice(index));
      break;
    }

    if (next.start > index) {
      pushText(value.slice(index, next.start));
    }

    const mathStart = next.start + next.delimiter.left.length;
    const mathEnd = value.indexOf(next.delimiter.right, mathStart);

    if (mathEnd === -1) {
      pushText(value.slice(next.start));
      break;
    }

    segments.push({
      type: "math",
      value: value.slice(mathStart, mathEnd),
      display: next.delimiter.display
    });
    index = mathEnd + next.delimiter.right.length;
  }

  return segments;
}

function findNextDelimiter(value: string, from: number) {
  return delimiters
    .map((delimiter) => ({ delimiter, start: value.indexOf(delimiter.left, from) }))
    .filter((match) => match.start !== -1)
    .sort((a, b) => a.start - b.start || b.delimiter.left.length - a.delimiter.left.length)[0];
}

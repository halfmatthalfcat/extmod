import { CodeHighlight, InlineCodeHighlight } from "@mantine/code-highlight";
import { FC, PropsWithChildren } from "react";

interface Props {
  className?: string;
}
export const code: FC<PropsWithChildren<Props>> = ({ children, className }) => {
  const language = /^language-(.+)$/.exec(className ?? "")?.[1];
  return typeof children === "string" && language ? (
    <CodeHighlight
      code={children}
      language={language}
      styles={{
        copy: {
          position: "absolute",
          background: "transparent",
          color: "var(--mantine-color-default-text)",
        },
      }}
    />
  ) : typeof children === "string" ? (
    <InlineCodeHighlight code={children} language="text" />
  ) : null;
};

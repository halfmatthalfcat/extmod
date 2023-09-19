import { ShellNav } from "@/components/shell/nav";
import { List, Paragraph } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toc } from "mdast-util-toc";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { FC } from "react";

export type TOCTree = Array<[string, TOCTree]>;

const recurseTOC = (list: List | undefined, tree: TOCTree = []): TOCTree =>
  list?.children.reduce((acc, { children }) => {
    const heading = ((p: Paragraph | undefined) => {
      if (p) {
        const {
          children: [child],
        } = p;
        if (child.type === "link") {
          const {
            children: [child2],
          } = child;
          if (child2.type === "text") {
            return child2.value;
          }
        }
      }

      return null;
    })(
      children.find((child): child is Paragraph => child.type === "paragraph")
    );
    const subitems = children.find(
      (child): child is List => child.type === "list"
    );

    return [
      ...acc,
      ...(heading
        ? [[heading, recurseTOC(subitems)] as [string, TOCTree]]
        : []),
    ];
  }, tree) ?? tree;

export const TOC: FC = async () => {
  const md = await readFile(
    new URL(join(dirname(import.meta.url), "index.mdx")).pathname,
    "utf-8"
  );
  const ast = fromMarkdown(md);
  const _toc = toc(ast);
  const tree = recurseTOC(_toc.map);

  return <ShellNav tree={tree} />;
};

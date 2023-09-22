"use client";

import type { TOCTree } from "@/app/toc";
import { Box, ScrollArea } from "@mantine/core";
import Slugger from "github-slugger";
import { FC, ReactNode } from "react";
import classes from "./nav.module.css";

const slugs = new Slugger();
slugs.reset();

const items = (tree: TOCTree, level: number = 0): Array<ReactNode> =>
  tree.flatMap(([heading, subtree]) => [
    <Box<"a">
      component="a"
      href={`/#${slugs.slug(heading)}`}
      key={`${heading}-${level}`}
      className={classes.link}
      style={{ paddingLeft: `calc(${level} * var(--mantine-spacing-md))` }}
    >
      {heading}
    </Box>,
    ...items(subtree, level + 1),
  ]);

interface Props {
  tree: TOCTree;
}
export const ShellNav: FC<Props> = ({ tree }) => items(tree);

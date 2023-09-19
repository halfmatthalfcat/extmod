import h from "@/components/mdx/h";
import type { MDXComponents } from "mdx/types";
import a from "./components/mdx/a";
import { block } from "./components/mdx/block";
import { code } from "./components/mdx/code";
import { Group, GroupItem } from "./components/mdx/group";

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including components from
// other libraries.

// This file is required to use MDX in `app` directory.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Allows customizing built-in components, e.g. to add styling.
    // h1: ({ children }) => <h1 style={{ fontSize: "100px" }}>{children}</h1>,
    ...components,
    a: a,
    h1: h(1),
    h2: h(2),
    h3: h(3),
    h4: h(4),
    h5: h(5),
    code: code,
    blockquote: block,
    Group,
    GroupItem,
  };
}

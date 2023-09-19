import { Blockquote } from "@mantine/core";
import { FC, PropsWithChildren } from "react";

export const block: FC<PropsWithChildren> = ({ children }) => (
  <Blockquote pt={5} pb={5} pl={20} pr={20}>
    {children}
  </Blockquote>
);

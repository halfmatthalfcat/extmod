"use client";

import { Table } from "@mantine/core";
import { FC, PropsWithChildren } from "react";

export const table: FC<PropsWithChildren> = ({ children }) => (
  <Table withColumnBorders={true}>{children}</Table>
);

export const thead: FC<PropsWithChildren> = ({ children }) => (
  <Table.Thead>{children}</Table.Thead>
);

export const tbody: FC<PropsWithChildren> = ({ children }) => (
  <Table.Tbody>{children}</Table.Tbody>
);

export const th: FC<PropsWithChildren> = ({ children }) => (
  <Table.Th>{children}</Table.Th>
);

export const tr: FC<PropsWithChildren> = ({ children }) => (
  <Table.Tr>{children}</Table.Tr>
);

export const td: FC<PropsWithChildren> = ({ children }) => (
  <Table.Td>{children}</Table.Td>
);

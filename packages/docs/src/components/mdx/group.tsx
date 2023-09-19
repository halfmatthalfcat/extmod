"use client";

import { Tabs } from "@mantine/core";
import { FC, PropsWithChildren } from "react";
const { List, Tab, Panel } = Tabs;

export const Group: FC<PropsWithChildren> = ({ children }) => {
  const tabs = Array.isArray(children)
    ? children.map((child) => (
        <Tab value={child.props.label} key={child.props.label}>
          {child.props.label}
        </Tab>
      ))
    : [];

  return (
    <Tabs defaultValue={tabs[0]?.key as string} mt={10} mb={10}>
      <List>{tabs}</List>
      {children}
    </Tabs>
  );
};

interface ItemProps {
  label: string;
}
export const GroupItem: FC<PropsWithChildren<ItemProps>> = ({
  label,
  children,
}) => <Panel value={label}>{children}</Panel>;

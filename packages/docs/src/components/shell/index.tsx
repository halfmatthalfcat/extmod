"use client";

import { ActionIcon, AppShell, Burger, Group, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBrandGithub } from "@tabler/icons-react";
import { FC, PropsWithChildren, ReactNode } from "react";

interface Props {
  sidebar: ReactNode;
}

export const DocShell: FC<PropsWithChildren<Props>> = ({
  children,
  sidebar,
}) => {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Title order={2}>extmod</Title>
          </Group>
          <ActionIcon variant="outline">
            <IconBrandGithub />
          </ActionIcon>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar
        p="md"
        style={{ overflowY: "scroll", scrollBehavior: "smooth" }}
      >
        {sidebar}
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};

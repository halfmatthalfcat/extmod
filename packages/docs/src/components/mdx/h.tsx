import { FC, PropsWithChildren } from "react";
import classes from "./h.module.css";

interface Props {
  id?: string;
}
const h: (level: number) => FC<PropsWithChildren<Props>> =
  (level: number) =>
  // eslint-disable-next-line react/display-name
  ({ id, children }) => {
    const Header = `h${level}` as keyof JSX.IntrinsicElements;
    return (
      <Header id={id} className={classes.header}>
        {children}
      </Header>
    );
  };

export default h;

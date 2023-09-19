import { FC, PropsWithChildren } from "react";
import classes from "./a.module.css";

interface Props {
  href?: string;
}
const a: FC<PropsWithChildren<Props>> = ({ href, children }) => (
  <a href={href} className={classes.link}>
    {children}
  </a>
);

export default a;

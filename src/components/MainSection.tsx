import "./MainSection.css";
import { classNames } from "../utils";

export const MainSection: React.FC<{
  className?: string;
  title: string;
  children?: React.ReactNode;
}> = ({ className, title, children }) => {
  return (
    <section className={classNames("main-section", className)}>
      <header>
        <h2>{title}</h2>
      </header>
      <main>{children}</main>
    </section>
  );
};

import "./Button.css";
import { classNames } from "../utils";

export const Button: React.FC<{
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  icon?: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
  disabled?: boolean;
  children?: React.ReactNode;
}> = ({ children, className, onClick, icon, disabled }) => {
  const Icon = icon;

  return (
    <button
      onClick={onClick}
      className={classNames("standard-button", className, !!Icon && "has-icon")}
      disabled={disabled}
    >
      {!!Icon && <Icon className="icon" />}
      <span>{children}</span>
    </button>
  );
};

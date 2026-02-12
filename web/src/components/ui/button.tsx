import { ButtonHTMLAttributes } from "react";
import styles from "./button.module.css";

type ButtonVariant = "blue" | "green" | "red";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

function cx(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export default function Button({
  variant = "blue",
  size = "md",
  fullWidth = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.button,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        className,
      )}
      {...props}
    />
  );
}

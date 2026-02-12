import { forwardRef, InputHTMLAttributes } from "react";
import styles from "./input.module.css";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

function cx(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cx(styles.input, className)} {...props} />;
});

export default Input;

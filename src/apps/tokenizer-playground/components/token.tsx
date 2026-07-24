import { Fragment } from "react";
import { cn } from "@/lib/utils";

const COLOURS = [
  "bg-purple-300 dark:bg-purple-600",
  "bg-green-300 dark:bg-green-600",
  "bg-yellow-300 dark:bg-yellow-600",
  "bg-red-300 dark:bg-red-600",
  "bg-blue-300 dark:bg-blue-600",
];

export interface TokenProps {
  text: string;
  position: number;
  margin: number;
}

export const Token = ({ text, position, margin }: TokenProps) => {
  const textWithLineBreaks = text.split("\n").map((line, index, array) => (
    <Fragment key={index}>
      {line}
      {index !== array.length - 1 && <br />}
    </Fragment>
  ));

  return (
    <span
      style={{ marginLeft: margin }}
      className={cn(
        "text-foreground leading-5",
        textWithLineBreaks.length === 1 && "inline-block",
        COLOURS[position % COLOURS.length]
      )}
    >
      {textWithLineBreaks}
    </span>
  );
};

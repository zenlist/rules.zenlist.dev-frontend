import React from "react";
import "./OutputControl.css";
import { Output } from "../evaluation/worker";
import { CodeBracketIcon } from "@heroicons/react/20/solid";

export const OutputControl: React.FC<{
  output?: Output;
}> = ({ output }) => {
  if (!output) {
    return (
      <code className="output-control missing">
        <CodeBracketIcon width="1em" height="1em" color="#8888ff" />{" "}
        <pre>—</pre>
      </code>
    );
  }

  switch (output.type) {
    case "error":
      return (
        <code className="output-control error">
          <CodeBracketIcon width="1em" height="1em" color="#8888ff" />{" "}
          <pre>{output.error}</pre>
        </code>
      );
    case "value":
      return (
        <code className="output-control">
          <CodeBracketIcon width="1em" height="1em" color="#8888ff" />{" "}
          <pre>
            {output.value === undefined ? "null" : JSON.stringify(output.value)}
          </pre>
        </code>
      );
  }
};

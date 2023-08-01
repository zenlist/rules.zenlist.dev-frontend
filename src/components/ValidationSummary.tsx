import React from "react";
import "./ValidationSummary.css";
import { EvaluationState, EvaluationStateType } from "../evaluation";
import { PlaygroundState, RuleAction } from "../playground-state";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import { OutputControl } from "./OutputControl";
import { Output } from "../evaluation/worker";

export const ValidationSummary: React.FC<{
  playgroundState: PlaygroundState;
  evaluationState: EvaluationState;
}> = ({ playgroundState, evaluationState }) => {
  const messagesAndEvaluations = React.useMemo(
    () => calculateMessages(playgroundState, evaluationState),
    [playgroundState, evaluationState]
  );

  if (evaluationState.type !== EvaluationStateType.Success) {
    return <>Evaluation failed</>;
  }

  const isValidationSuccessful =
    Object.entries(messagesAndEvaluations.messages).length === 0;

  return (
    <section className="validation">
      {isValidationSuccessful && (
        <div className="clean">
          <CheckCircleIcon className="icon" />{" "}
          <span>Validation successful!</span>
        </div>
      )}
      {Object.entries(messagesAndEvaluations.messages).map((item) => {
        let [fieldName, messages] = item;
        return (
          <div key={fieldName} className="validation-item-container">
            {messages.map((message) => {
              return (
                <div key={message.id} className="validation-item">
                  {message.level === "error" ? (
                    <ExclamationCircleIcon
                      className="error"
                      width="1em"
                      height="1em"
                    />
                  ) : (
                    <ExclamationTriangleIcon
                      className="warning"
                      width="1em"
                      height="1em"
                    />
                  )}{" "}
                  <span>
                    <strong>{fieldName}:</strong> {message.message}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
      {messagesAndEvaluations.evaluations.map((item) => {
        return (
          <div key={item.id} className="information-item">
            <div>{item.message}</div>
            <OutputControl output={item.output} />
          </div>
        );
      })}
    </section>
  );
};

function calculateMessages(
  playgroundState: PlaygroundState,
  evaluationState: EvaluationState
): MessagesAndEvaluations {
  const messagesByField: MessagesByField = {};
  const evaluations: Evaluations = [];

  if (evaluationState.type !== EvaluationStateType.Success) {
    return {
      messages: messagesByField,
      evaluations,
    };
  }

  // JSON *should* always be valid, right, since the evaluator accepted it.
  let json;
  try {
    json = JSON.parse(playgroundState.data);
  } catch {
    json = {};
  }

  for (const rule of playgroundState.rules) {
    const value = evaluationState.values[rule.id] ?? {
      type: "error",
      error: "Not found",
    };
    switch (rule.RuleAction) {
      case RuleAction.Accept:
        if (value.type === "value" && value.value === true) {
          // Accepted!
        } else {
          messagesByField[rule.FieldName] =
            messagesByField[rule.FieldName] ?? [];
          messagesByField[rule.FieldName].push({
            id: rule.id,
            level: "error",
            message: rule.RuleMessage,
          });
        }
        break;
      case RuleAction.Reject:
        if (value.type === "value" && value.value === true) {
          messagesByField[rule.FieldName] =
            messagesByField[rule.FieldName] ?? [];
          messagesByField[rule.FieldName].push({
            id: rule.id,
            level: "error",
            message: rule.RuleMessage,
          });
        }
        break;
      case RuleAction.Warning:
        if (value.type === "value" && value.value === true) {
          messagesByField[rule.FieldName] =
            messagesByField[rule.FieldName] ?? [];
          messagesByField[rule.FieldName].push({
            id: rule.id,
            level: "warning",
            message: rule.RuleMessage,
          });
        }
        break;
      case RuleAction.SetRequired:
        if (value.type === "value" && value.value === true) {
          // rule.FieldName is required. Check if it's been set.
          if (
            json[rule.FieldName] === null ||
            json[rule.FieldName] === undefined
          ) {
            // It hasn't. That's an error.
            messagesByField[rule.FieldName] =
              messagesByField[rule.FieldName] ?? [];
            messagesByField[rule.FieldName].push({
              id: rule.id,
              level: "error",
              message: rule.RuleMessage,
            });
          }
        }
        break;
      case RuleAction.Evaluate:
        evaluations.push({
          id: rule.id,
          message: rule.RuleMessage,
          output: value,
        });
    }
  }

  return {
    messages: messagesByField,
    evaluations,
  };
}

interface MessagesAndEvaluations {
  messages: MessagesByField;
  evaluations: Evaluations;
}

type MessagesByField = {
  [index: string]: Message[];
};

interface Message {
  level: "error" | "warning";
  id: string;
  message: string;
}

type Evaluations = Evaluation[];

interface Evaluation {
  id: string;
  message: string;
  output: Output;
}

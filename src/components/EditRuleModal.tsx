import React from "react";
import "./EditRuleModal.css";
import { Rule, RuleAction } from "../playground-state";
import { Output } from "../evaluation/worker";
import { OutputControl } from "./OutputControl";
import { Button } from "./Button";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";

export const EditRuleModal: React.FC<{
  rule?: Rule;
  output?: Output;
  ruleOrder: number;
  onClose: () => void;
  onUpdate: (rule: Rule) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}> = ({
  rule: optionalRule,
  output,
  onClose,
  onUpdate: updateRule,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  ruleOrder,
}) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    if (dialogRef.current && !dialogRef.current!.open) {
      dialogRef.current!.showModal();
    }
  }, [optionalRule, dialogRef]);

  React.useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.addEventListener("close", () => {
        onClose();
      });
    }
  }, [dialogRef]);

  if (!optionalRule) {
    return <></>;
  }
  const rule = optionalRule;

  const fieldName = rule.FieldName;
  const ruleExpression = rule.RuleExpression;
  const ruleMessage = rule.RuleMessage;
  const ruleAction = rule.RuleAction;

  function setFieldName(value: string) {
    updateRule({
      ...rule,
      FieldName: value,
    });
  }
  function setRuleAction(value: RuleAction) {
    updateRule({
      ...rule,
      RuleAction: value,
    });
  }
  function setRuleMessage(value: string) {
    updateRule({
      ...rule,
      RuleMessage: value,
    });
  }
  function setRuleExpression(value: string) {
    updateRule({
      ...rule,
      RuleExpression: value,
    });
  }

  return (
    <dialog ref={dialogRef} className="edit-rule-dialog">
      <div className="action-buttons">
        <Button icon={CheckIcon} onClick={() => onClose()}>
          Close
        </Button>
        <Button icon={TrashIcon} onClick={() => onDelete()}>
          Delete
        </Button>
        <Button
          icon={ArrowUpIcon}
          disabled={!canMoveUp}
          onClick={() => onMoveUp()}
        >
          Move up
        </Button>
        <Button
          icon={ArrowDownIcon}
          disabled={!canMoveDown}
          onClick={() => onMoveDown()}
        >
          Move down
        </Button>
      </div>

      <div>
        <label>FieldName</label>
        <input
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
        />
      </div>

      <div>
        <label>RuleOrder</label>
        <div className="rule-order">{ruleOrder}</div>
      </div>

      <div>
        <label>RuleAction</label>
        <select
          value={ruleAction}
          onChange={(e) => setRuleAction(e.target.value as RuleAction)}
        >
          <option value={RuleAction.Evaluate}>EVALUATE</option>
          <option value={RuleAction.Accept}>ACCEPT</option>
          <option value={RuleAction.Reject}>REJECT</option>
          <option value={RuleAction.Warning}>WARNING</option>
          <option value={RuleAction.Set}>SET</option>
          <option value={RuleAction.SetRequired}>SET_REQUIRED</option>
        </select>
      </div>

      <div>
        <label>RuleMessage</label>
        <input
          value={ruleMessage}
          onChange={(e) => setRuleMessage(e.target.value)}
        />
      </div>

      <div>
        <label>RuleExpression</label>
        <textarea
          className="expressionEdit"
          value={ruleExpression}
          rows={ruleExpression.split("\n").length + 2}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => {
            setRuleExpression(event.target.value);
          }}
          onBlur={(event) => {
            setRuleExpression(event.target.value);
          }}
        />
      </div>

      <div>
        <label>Expression Evaluation</label>
        <OutputControl output={output} />
      </div>
    </dialog>
  );
};

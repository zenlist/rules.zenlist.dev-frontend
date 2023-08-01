import React from "react";
import "./RuleSummary.css";
import { Output } from "../evaluation/worker";
import { Rule, RuleWithId } from "../playground-state";
import { EditRuleModal } from "./EditRuleModal";
import { OutputControl } from "./OutputControl";
import { classNames } from "../utils";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";

export const RuleSummary: React.FC<{
  rule: RuleWithId;
  onEdit: () => void;
}> = ({ rule, onEdit }) => {
  return (
    <>
      <button className="rule-summary" onClick={() => onEdit()}>
        <div className="field-and-action">
          <div className="field-name">{rule.FieldName}</div>
          <div className={classNames("rule-action", rule.RuleAction)}>
            {rule.RuleAction}
          </div>
        </div>
        <div className="rule-message">{rule.RuleMessage}</div>
      </button>
    </>
  );
};

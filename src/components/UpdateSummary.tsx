import { EvaluationState, EvaluationStateType } from "../evaluation";
import { Output } from "../evaluation/worker";
import { Rule, RuleWithId } from "../playground-state";

export const UpdateSummary: React.FC<{
  evaluationState: EvaluationState;
}> = ({ evaluationState }) => {
  if (evaluationState.type !== EvaluationStateType.Success) {
    return <>No updates found</>;
  }

  const updateKeys = Object.keys(evaluationState.updates);
  updateKeys.sort();
  if (updateKeys.length === 0) {
    return (
      <section className="evaluationState empty">
        Values set by SET actions will show up here
      </section>
    );
  } else {
    const obj: { [index: string]: any } = {};
    for (const key of updateKeys) {
      obj[key] = evaluationState.updates[key];
    }
    return (
      <section className="evaluationState">
        <code>
          <pre>{JSON.stringify(obj, undefined, 2)}</pre>
        </code>
      </section>
    );
  }
};

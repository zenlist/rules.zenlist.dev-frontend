import React from "react";
import { Request, Response, ResponseType, Updates, Values } from "./worker";
import { WorkerManager } from "./worker-manager";
import { PlaygroundState } from "../playground-state";

export const WorkerContext = React.createContext<
  React.MutableRefObject<WorkerManager | undefined> | undefined
>(undefined);

export const EvaluationContextProvider: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const worker = React.useRef<WorkerManager>();
  React.useEffect(() => {
    try {
      const w = new Worker(new URL("./worker.ts", import.meta.url));
      const wm = new WorkerManager(w);
      worker.current = wm;
    } catch (err) {
      console.log(`Failed to create worker: ${err}`);
    }
  }, [worker]);

  return (
    <WorkerContext.Provider value={worker}>{children}</WorkerContext.Provider>
  );
};

export enum EvaluationStateType {
  Loading,
  Success,
  JsonParseError,
  ExpressionParseError,
  ExpressionEvaluationError,
  UnknownError,
}

export type EvaluationState =
  | { type: EvaluationStateType.Loading }
  | {
      type: EvaluationStateType.Success;
      values: Values;
      updates: Updates;
    }
  | {
      type: EvaluationStateType.JsonParseError;
      error: string;
    }
  | {
      type: EvaluationStateType.ExpressionParseError;
      error: string;
    }
  | {
      type: EvaluationStateType.ExpressionEvaluationError;
      error: string;
    }
  | {
      type: EvaluationStateType.UnknownError;
      error: string;
    };

export function useEvaluation(
  playgroundState: PlaygroundState
): EvaluationState {
  const workerContext = React.useContext(WorkerContext);

  const [state, setState] = React.useState<EvaluationState>({
    type: EvaluationStateType.Loading,
  });

  React.useEffect(() => {
    setState({ type: EvaluationStateType.Loading });
    if (workerContext && workerContext.current) {
      workerContext?.current
        .evaluate({
          ...playgroundState,
        })
        .then((response) => {
          setState(evaluationStateFromResponse(response));
        });
    }
  }, [
    workerContext,
    workerContext && workerContext.current,
    playgroundState,
    setState,
  ]);

  return state;
}

function evaluationStateFromResponse(response: Response): EvaluationState {
  switch (response.type) {
    case ResponseType.Success:
      return {
        type: EvaluationStateType.Success,
        values: response.values,
        updates: response.updates,
      };
    case ResponseType.JsonParseError:
      return {
        type: EvaluationStateType.JsonParseError,
        error: response.error,
      };
    case ResponseType.ExpressionParseError:
      return {
        type: EvaluationStateType.ExpressionParseError,
        error: response.error,
      };
    case ResponseType.ExpressionEvaluateError:
      return {
        type: EvaluationStateType.ExpressionEvaluationError,
        error: response.error,
      };
    case ResponseType.UnknownError:
      return {
        type: EvaluationStateType.UnknownError,
        error: "Unknown error",
      };
  }
}

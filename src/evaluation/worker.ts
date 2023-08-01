import { RuleWithId } from "../playground-state";

const evaluatorPromise = import("evaluator");

export type Request = {
  rules: RuleWithId[];
  data: string;
  previousData: string;
};

export enum RequestExpressionType {
  RetsVe,
}

export type RequestEnvelope = Request & { unique: number };

export type ResponseEnvelope = Response & {
  unique: number;
};

export type Response =
  | SuccessResponse
  | JsonParseErrorResponse
  | ExpressionParseErrorResponse
  | ExpressionEvaluateErrorResponse
  | UnknownErrorResponse;

export type SuccessResponse = {
  type: ResponseType.Success;
  values: Values;
  updates: Updates;
};

export type Values = { [index: string]: Output };
export type Updates = { [index: string]: any };

export type Output = OutputSuccess | OutputError;

export interface OutputSuccess {
  type: "value";
  value: any;
}

export interface OutputError {
  type: "error";
  error: string;
}

export type JsonParseErrorResponse = {
  type: ResponseType.JsonParseError;
  error: string;
};
export type ExpressionParseErrorResponse = {
  type: ResponseType.ExpressionParseError;
  error: string;
};
export type ExpressionEvaluateErrorResponse = {
  type: ResponseType.ExpressionEvaluateError;
  error: string;
};
export type UnknownErrorResponse = {
  type: ResponseType.UnknownError;
};

export enum ResponseType {
  Success,
  JsonParseError,
  ExpressionParseError,
  ExpressionEvaluateError,
  UnknownError,
}

function errorToResponse(err: any): Response {
  if (err.type === "json_parse_error") {
    return {
      type: ResponseType.JsonParseError,
      error: err.error as string,
    };
  } else if (err.type === "expression_parse_error") {
    return {
      type: ResponseType.ExpressionParseError,
      error: err.error as string,
    };
  } else if (err.type === "expression_runtime_error") {
    return {
      type: ResponseType.ExpressionEvaluateError,
      error: err.error as string,
    };
  } else {
    return {
      type: ResponseType.UnknownError,
    };
  }
}

onmessage = (event: MessageEvent<RequestEnvelope>) => {
  if (typeof event.data.unique !== "number") {
    return;
  }

  const request = event.data;
  evaluatorPromise.then((evaluator) => {
    const now = new Date();
    const nowString = now.toISOString();
    const todayString = [
      now.getFullYear(),
      ("0" + (now.getMonth() + 1)).slice(-2),
      ("0" + now.getDate()).slice(-2),
    ].join("-");

    let response: Response;

    try {
      const result = evaluator.evaluate(
        JSON.stringify(request.rules),
        request.data,
        request.previousData,
        nowString,
        todayString
      );
      const values: Values = {};
      for (const [key, value] of result.values) {
        values[key] = value;
      }
      const updates: Updates = {};
      for (const [key, value] of result.updates) {
        updates[key] = value;
      }

      response = {
        type: ResponseType.Success,
        values,
        updates,
      };
    } catch (err) {
      response = errorToResponse(err);
    }

    const responseEnvelope: ResponseEnvelope = {
      unique: request.unique,
      ...response,
    };
    postMessage(responseEnvelope);
  });
};

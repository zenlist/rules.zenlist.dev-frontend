import React from "react";

export interface PlaygroundState {
  data: string;
  previousData: string;
  rules: RuleWithId[];
}

export interface SerializedPlaygroundState {
  data: string;
  previousData: string;
  rules: Rule[];
}

export interface Rule {
  FieldName: string;
  RuleAction: RuleAction;
  RuleExpression: string;
  RuleMessage: string;
}

export enum RuleAction {
  Evaluate = "EVALUATE",
  Reject = "REJECT",
  Accept = "ACCEPT",
  Warning = "WARNING",
  Set = "SET",
  SetRequired = "SET_REQUIRED",
}

export type RuleWithId = Rule & { id: string };

export function isPlaygroundState(obj: any): obj is PlaygroundState {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.data === "string" &&
    typeof obj.previousData === "string" &&
    Array.isArray(obj.rules) &&
    obj.rules.every((item: any) => isRuleWithId(item))
  );
}

export function isSerializedPlaygroundState(
  obj: any
): obj is SerializedPlaygroundState {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.data === "string" &&
    typeof obj.previousData === "string" &&
    Array.isArray(obj.rules) &&
    obj.rules.every((item: any) => isRule(item))
  );
}

export function isRuleWithId(obj: any): obj is RuleWithId {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.id === "string" &&
    isRule(obj)
  );
}

export function isRule(obj: any): obj is Rule {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.FieldName === "string" &&
    isRuleAction(obj.RuleAction) &&
    typeof obj.RuleExpression === "string" &&
    typeof obj.RuleMessage === "string"
  );
}

export function isRuleAction(obj: any): obj is RuleAction {
  return (
    typeof obj === "string" &&
    (obj === RuleAction.Evaluate ||
      obj === RuleAction.Accept ||
      obj === RuleAction.Reject ||
      obj === RuleAction.Warning ||
      obj === RuleAction.Set ||
      obj === RuleAction.SetRequired)
  );
}

export function serializePlaygroundState(
  state: PlaygroundState
): SerializedPlaygroundState {
  return {
    data: state.data,
    previousData: state.previousData,
    rules: state.rules.map((rule: RuleWithId): Rule => {
      return {
        FieldName: rule.FieldName,
        RuleAction: rule.RuleAction,
        RuleMessage: rule.RuleMessage,
        RuleExpression: rule.RuleExpression,
      };
    }),
  };
}

export function parsePlaygroundState(input: any): PlaygroundState {
  if (!isSerializedPlaygroundState(input)) {
    throw new Error("Input is not valid playground state");
  }

  return {
    data: input.data,
    previousData: input.previousData,
    rules: input.rules.map((rule) => {
      return { id: crypto.randomUUID(), ...rule };
    }),
  };
}

function createInitialState(): PlaygroundState {
  return {
    data: JSON.stringify(
      {
        "@reso.context": "urn:reso:metadata:2.0:resource:property",
        MlsStatus: "Active",
      },
      undefined,
      2
    ),
    previousData: "null",
    rules: [],
  };
}

export interface PlaygroundStateUpdaters {
  setPlaygroundState: React.Dispatch<React.SetStateAction<PlaygroundState>>;
  setData: React.Dispatch<React.SetStateAction<string>>;
  setPreviousData: React.Dispatch<React.SetStateAction<string>>;
  setRule: (id: string, value: React.SetStateAction<RuleWithId>) => void;
  addRule: (rule: RuleWithId) => void;
  moveRule: (id: string, direction: "up" | "down") => void;
  removeRule: (id: string) => void;
}

export function usePlaygroundState(
  initial?: PlaygroundState
): [PlaygroundState, PlaygroundStateUpdaters] {
  const [state, setPlaygroundState] = React.useState<PlaygroundState>(() => {
    return initial ?? createInitialState();
  });

  const setData = React.useCallback((input: React.SetStateAction<string>) => {
    return setPlaygroundState((state: PlaygroundState) => {
      const newValue = typeof input === "function" ? input(state.data) : input;
      const newState: PlaygroundState = {
        ...state,
        data: newValue,
      };
      return newState;
    });
  }, []);

  const setPreviousData = React.useCallback(
    (input: React.SetStateAction<string>) => {
      const newValue =
        typeof input === "function" ? input(state.previousData) : input;
      setPlaygroundState((state: PlaygroundState) => {
        const newState: PlaygroundState = {
          ...state,
          previousData: newValue,
        };
        return newState;
      });
    },
    []
  );

  const setRule = React.useCallback(
    (id: string, value: React.SetStateAction<RuleWithId>) => {
      setPlaygroundState((state: PlaygroundState) => {
        let ruleFound = false;
        const newRules = state.rules.map((rule) => {
          if (rule.id === id) {
            ruleFound = true;
            return typeof value === "function" ? value(rule) : value;
          } else {
            return rule;
          }
        });

        if (!ruleFound) {
          console.warn(
            `setRule with id=${id}: matching rule was not found. No update occurred.`
          );
        }

        return {
          data: state.data,
          previousData: state.previousData,
          rules: newRules,
        };
      });
    },
    []
  );

  const addRule = React.useCallback((rule: RuleWithId) => {
    setPlaygroundState((state: PlaygroundState) => {
      return {
        data: state.data,
        previousData: state.previousData,
        rules: [...state.rules, rule],
      };
    });
  }, []);

  const moveRule = React.useCallback((id: string, direction: "up" | "down") => {
    setPlaygroundState((state: PlaygroundState) => {
      const indexOf = state.rules.findIndex((rule) => rule.id === id);
      if (indexOf < 0) {
        console.warn(
          `moveRule with id=${id}: matching rule was not found. No update occurred.`
        );
        return state;
      }

      let newIndex = indexOf;
      switch (direction) {
        case "up":
          newIndex = Math.max(indexOf - 1, 0);
          break;
        case "down":
          newIndex = Math.min(indexOf + 1, state.rules.length - 1);
          break;
      }

      if (indexOf === newIndex) {
        return state;
      }

      let newRules;
      switch (direction) {
        case "up":
          const upBefore = state.rules.slice(0, indexOf - 1);
          const upReplacement = state.rules.slice(newIndex, newIndex + 1);
          const upCurrent = state.rules.slice(indexOf, indexOf + 1);
          const upAfter = state.rules.slice(indexOf + 1);
          newRules = [...upBefore, ...upCurrent, ...upReplacement, ...upAfter];
          break;
        case "down":
          const downBefore = state.rules.slice(0, newIndex - 1);
          const downReplacement = state.rules.slice(newIndex, newIndex + 1);
          const downCurrent = state.rules.slice(indexOf, indexOf + 1);
          const downAfter = state.rules.slice(newIndex + 1);
          newRules = [
            ...downBefore,
            ...downReplacement,
            ...downCurrent,
            ...downAfter,
          ];
          break;
      }

      return {
        data: state.data,
        previousData: state.previousData,
        rules: newRules,
      };
    });
  }, []);

  const removeRule = React.useCallback((id: string) => {
    setPlaygroundState((state: PlaygroundState) => {
      let ruleFound = false;
      const newRules = state.rules.filter((rule) => {
        if (rule.id === id) {
          ruleFound = true;
          return false;
        } else {
          return true;
        }
      });

      if (!ruleFound) {
        console.warn(
          `removeRule with id=${id}: matching rule was not found. No update occurred.`
        );
      }

      return {
        data: state.data,
        previousData: state.previousData,
        rules: newRules,
      };
    });
  }, []);

  return [
    state,
    {
      setPlaygroundState,
      setData,
      setPreviousData,
      setRule,
      addRule,
      moveRule,
      removeRule,
    },
  ];
}

export function defaultPlaygroundState(): PlaygroundState {
  const data = {
    "@reso.context": "urn:reso:metadata:2.0:resource:property",
    ListPrice: 1000000,
    PublicRemarks: "This message does not contain a phone number",
    MlsStatus: "Pending",
    ParkingTotal: 3,
    GarageSpaces: 3,
    OpenParkingSpaces: null,
    Cooling: ["Electric", "Central Air"],
  };
  const previousData = {
    "@reso.context": "urn:reso:metadata:2.0:resource:property",
    ListPrice: 1200000,
    MlsStatus: "Active",
    ParkingTotal: 3,
    GarageSpaces: 3,
    OpenParkingSpaces: null,
  };
  const state: SerializedPlaygroundState = {
    data: JSON.stringify(data, undefined, 2),
    previousData: JSON.stringify(previousData, undefined, 2),
    rules: [
      {
        FieldName: "LastPrice",
        RuleAction: RuleAction.Accept,
        RuleMessage: "List price must be greater than 0",
        RuleExpression: "ListPrice > 0",
      },
      {
        FieldName: "PublicRemarks",
        RuleAction: RuleAction.Reject,
        RuleMessage: "Public remarks must not contain a phone number",
        RuleExpression: 'MATCH(\n  PublicRemarks,\n  "\\\\d{3}-\\\\d{4}"\n)\n',
      },
      {
        FieldName: "ClosePrice",
        RuleAction: RuleAction.SetRequired,
        RuleMessage: "A close price is required when closing a listing",
        RuleExpression: 'MlsStatus = "Closed"',
      },
      {
        FieldName: "ParkingTotal",
        RuleAction: RuleAction.Accept,
        RuleMessage:
          "Parking Total must be consistent with Garage Spaces and Open Parking Spaces",
        RuleExpression:
          "IIF(ParkingTotal != .EMPTY., ParkingTotal, 0) = IIF(GarageSpaces != .EMPTY., GarageSpaces, 0) + IIF(OpenParkingSpaces != .EMPTY., OpenParkingSpaces, 0)",
      },
      {
        FieldName: "Cooling",
        RuleAction: RuleAction.Accept,
        RuleMessage: "Cooling can not contain 'None' and other values",
        RuleExpression:
          '.NOT. (Cooling .CONTAINS. "None") .OR. LENGTH(Cooling) = 1',
      },
      {
        FieldName: "PreviousListPrice",
        RuleAction: RuleAction.Set,
        RuleMessage: "Update the previous list price when a new price is set",
        RuleExpression:
          "IIF(ListPrice != LAST ListPrice,\n  LAST ListPrice,\n  PreviousListPrice)\n",
      },
      {
        FieldName: "PendingTimestamp",
        RuleAction: RuleAction.Set,
        RuleMessage:
          "Set the Pending Timestamp when the listing transitions to pending",
        RuleExpression:
          'IIF(MlsStatus = "Pending" .AND.\n      LAST MlsStatus != "Pending",\n  .NOW.,\n  PendingTimestamp)\n',
      },
    ],
  };
  return parsePlaygroundState(state);
}

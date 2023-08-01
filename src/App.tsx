import React from "react";
import "./App.css";
import { EvaluationStateType, useEvaluation } from "./evaluation";
import {
  usePlaygroundState,
  parsePlaygroundState,
  RuleAction,
  serializePlaygroundState,
  RuleWithId,
  defaultPlaygroundState,
} from "./playground-state";
import { RuleSummary } from "./components/RuleSummary";
import { UpdateSummary } from "./components/UpdateSummary";
import { ValidationSummary } from "./components/ValidationSummary";
import { classNames } from "./utils";
import { MainSection } from "./components/MainSection";
import { DataEditor } from "./components/DataEditor";
import { Button } from "./components/Button";
import { ArrowTopRightOnSquareIcon, PlusIcon } from "@heroicons/react/20/solid";
import { EditRuleModal } from "./components/EditRuleModal";
import { Output } from "./evaluation/worker";
import { ShareComponent } from "./components/ShareComponent";
import { useShare } from "./share";

let appDidInit = false;

const App: React.FC<{}> = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [editingRuleId, setEditingRuleId] = React.useState<string>();
  const [shareState, share] = useShare(new URL(window.location.href));
  const [isModifiedSinceShare, setIsModifiedSinceShare] = React.useState(false);

  const [
    playgroundState,
    {
      setPlaygroundState,
      addRule,
      setData,
      setPreviousData,
      setRule,
      moveRule,
      removeRule,
    },
  ] = usePlaygroundState();

  const evaluationState = useEvaluation(playgroundState);

  let editingRule: RuleWithId | undefined;
  let editingOutput: Output | undefined;
  let editingRuleOrder: number = 0;

  if (!!editingRuleId) {
    editingRule = playgroundState.rules.find(
      (rule) => rule.id === editingRuleId
    );
    editingRuleOrder =
      playgroundState.rules.findIndex((rule) => rule.id === editingRuleId) + 1;
    if (evaluationState.type === EvaluationStateType.Success) {
      editingOutput = evaluationState.values[editingRuleId];
    }
  }

  // On initial load, load from gist, parameter, or local storage if available.
  React.useEffect(() => {
    if (appDidInit) {
      return;
    }

    appDidInit = true;

    const init = async () => {
      let loadedFromElsewhere = false;

      const queryString = new URLSearchParams(window.location.search);

      const gist = queryString.get("gist");
      if (gist) {
        try {
          const response = await fetch(
            `https://rules.zenlist.dev/gists/${gist}`
          );
          const json = await response.json();
          const playgroundState = parsePlaygroundState(json);
          setPlaygroundState(playgroundState);
          loadedFromElsewhere = true;
        } catch (e: any) {
          console.log(`Gist ${gist} is not valid data`);
        }
      }

      const data = queryString.get("data");
      if (data) {
        try {
          const json = JSON.parse(data);
          const playgroundState = parsePlaygroundState(json);
          setPlaygroundState(playgroundState);
          loadedFromElsewhere = true;
        } catch {}
      }

      if (!loadedFromElsewhere) {
        const storedState = localStorage.getItem("state");
        if (storedState) {
          try {
            const parsedStoredState = JSON.parse(storedState);
            const playgroundState = parsePlaygroundState(parsedStoredState);
            setPlaygroundState(playgroundState);
            loadedFromElsewhere = true;
          } catch {}
        }
      }

      if (!loadedFromElsewhere) {
        setPlaygroundState(defaultPlaygroundState());
      }

      setIsLoading(false);
    };

    init();
  }, [setIsLoading, setPlaygroundState, setData, setPreviousData, addRule]);

  const createRule = React.useCallback(() => {
    const id = crypto.randomUUID();
    const newRule = {
      id,
      FieldName: "ListPrice",
      RuleAction: RuleAction.Evaluate,
      RuleMessage: `Result of evaluating the rule created at ${new Date().toLocaleTimeString()}`,
      RuleExpression: "INT(ListPrice * 1.25)",
    };
    addRule(newRule);
    setEditingRuleId(id);
    setIsModifiedSinceShare(true);
  }, [addRule, setEditingRuleId, setIsModifiedSinceShare]);

  const formattedState = React.useMemo(
    () => serializePlaygroundState(playgroundState),
    [playgroundState]
  );

  // Save any changes to local storage
  React.useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("state", JSON.stringify(formattedState));
    }
  }, [formattedState, isLoading]);

  React.useEffect(() => {
    if (isModifiedSinceShare) {
      window.history.replaceState(null, "", "/");
    } else if (shareState.id) {
      window.history.replaceState(null, "", `?gist=${shareState.id}`);
    }
  }, [shareState, isModifiedSinceShare]);

  return (
    <>
      {!isLoading && (
        <header className="page-header">
          <Button
            icon={ArrowTopRightOnSquareIcon}
            onClick={() => {
              setIsModifiedSinceShare(false);
              share(playgroundState);
            }}
          >
            Share
          </Button>
          {/* <Button icon={QuestionMarkCircleIcon}>Help</Button> */}
        </header>
      )}
      <main
        className={classNames("page-main", isLoading ? "is-loading" : "loaded")}
      >
        {isLoading && (
          <>
            <MainSection className="loading" title="Loading...">
              Loading...
            </MainSection>
          </>
        )}
        {!isLoading && (
          <div className="sides">
            <div className="side side-left">
              <MainSection className="rules" title="Rules">
                {playgroundState.rules.map((rule) => (
                  <RuleSummary
                    rule={rule}
                    key={rule.id}
                    onEdit={() => {
                      setEditingRuleId(rule.id);
                    }}
                  />
                ))}
                <div style={{ marginTop: "1em" }}>
                  <Button icon={PlusIcon} onClick={() => createRule()}>
                    Add rule
                  </Button>
                </div>

                <EditRuleModal
                  rule={editingRule}
                  output={editingOutput}
                  onClose={() => setEditingRuleId(undefined)}
                  onUpdate={(newRule) => {
                    setIsModifiedSinceShare(true);
                    setRule(editingRule!.id, {
                      ...newRule,
                      id: editingRule!.id,
                    });
                  }}
                  onDelete={() => {
                    setIsModifiedSinceShare(true);
                    removeRule(editingRule!.id);
                  }}
                  canMoveUp={editingRuleOrder > 1}
                  canMoveDown={editingRuleOrder < playgroundState.rules.length}
                  onMoveUp={() => {
                    setIsModifiedSinceShare(true);
                    moveRule(editingRule!.id, "up");
                  }}
                  onMoveDown={() => {
                    setIsModifiedSinceShare(true);
                    moveRule(editingRule!.id, "down");
                  }}
                  ruleOrder={editingRuleOrder}
                />
              </MainSection>
              <MainSection className="data current-data" title="Data">
                <DataEditor
                  name="Data"
                  data={playgroundState.data}
                  onUpdate={(newData) => {
                    setIsModifiedSinceShare(true);
                    setData(newData);
                  }}
                />
              </MainSection>
              <MainSection className="data previous-data" title="Previous Data">
                <DataEditor
                  name="Previous data"
                  data={playgroundState.previousData}
                  onUpdate={(newData) => {
                    setIsModifiedSinceShare(true);
                    setPreviousData(newData);
                  }}
                />
              </MainSection>
            </div>
            <div className="side side-right">
              <div className="sticky-container">
                {(shareState.url ||
                  shareState.isSharing ||
                  shareState.error) && (
                  <MainSection className="share" title="Share">
                    <ShareComponent
                      isShareModified={isModifiedSinceShare}
                      isSharing={shareState.isSharing}
                      shareUrl={shareState.url}
                      sharingError={shareState.error}
                    />
                  </MainSection>
                )}
                <MainSection className="validation" title="Output">
                  <ValidationSummary
                    playgroundState={playgroundState}
                    evaluationState={evaluationState}
                  />
                </MainSection>
                <MainSection className="updates" title="Updates">
                  <UpdateSummary evaluationState={evaluationState} />
                </MainSection>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="page-footer">
        Made with 💚 by <a href="https://zenlist.com">Zenlist</a>
      </footer>
    </>
  );
};

export default App;

import React from "react";
import { PlaygroundState, serializePlaygroundState } from "../playground-state";

async function share(url: URL, state: PlaygroundState): Promise<[string, URL]> {
  const response = await fetch("https://rules.zenlist.dev/gists/", {
    method: "POST",
    body: JSON.stringify(serializePlaygroundState(state)),
  });

  const json = await response.json();
  const id = json.id;
  return [id, new URL(`?gist=${id}`, url)];
}

interface ShareState {
  isSharing: boolean;
  id?: string;
  url?: URL;
  error?: string;
}

export function useShare(
  baseUrl: URL
): [ShareState, (state: PlaygroundState) => void] {
  const [shareState, setShareState] = React.useState<ShareState>({
    isSharing: false,
  });

  const shareFn = React.useCallback((state: PlaygroundState) => {
    setShareState({
      isSharing: true,
    });
    const promise = share(baseUrl, state);
    promise
      .then(([id, url]) =>
        setShareState({
          isSharing: false,
          id,
          url,
        })
      )
      .catch((err) =>
        setShareState({
          isSharing: false,
          error: err.toString(),
        })
      );
  }, []);
  return [shareState, shareFn];
}

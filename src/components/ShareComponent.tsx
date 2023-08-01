import React from "react";
import "./ShareComponent.css";

export const ShareComponent: React.FC<{
  shareUrl?: URL;
  sharingError?: string;
  isSharing: boolean;
  isShareModified: boolean;
}> = ({ shareUrl, sharingError, isSharing, isShareModified }) => {
  if (isSharing) {
    return <div className="sharing-component is-sharing">Sharing...</div>;
  }

  if (sharingError) {
    return <div className="sharing-component error">{sharingError}</div>;
  }

  if (shareUrl) {
    return (
      <div className="sharing-component shared">
        <div>
          <a href={shareUrl.toString()}>{shareUrl.toString()}</a>
        </div>
        {isShareModified && (
          <div className="modification-marker">
            (rules have been modified since this was shared)
          </div>
        )}
      </div>
    );
  }

  return <div className="sharing-component error">Something went wrong.</div>;
};

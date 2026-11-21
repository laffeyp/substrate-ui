// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (C) 2026 Peter Laffey
// Sprint 527: a React error boundary that catches render errors in one area of the window
// and shows a fallback naming the area, so a fault in one area does not blank the rest.

import * as React from "react";

interface Props {
  area: string;
  onError?: (area: string, error: Error) => void;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error): void {
    this.props.onError?.(this.props.area, error);
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px 26px", color: "#c26058" }}>
          <div style={{ marginBottom: 8 }}>Something went wrong in {this.props.area}.</div>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: "#3d434c", color: "#b9bec5", border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

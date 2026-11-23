import { Component } from 'react';

export default class PageErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="not-found" role="alert">
      <h1>This page couldn’t load</h1>
      <p>Reload to try again, or return to the guides.</p>
      <a className="button-primary" href="/guides/">Browse the guides</a>
      {' '}
      <button type="button" onClick={() => window.location.reload()}>Reload page</button>
    </main>;
  }
}

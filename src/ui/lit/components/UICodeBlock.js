import { LitElement, html, css } from 'lit'

export class UICodeBlock extends LitElement {
	static properties = {
		language: { type: String },
		code: { type: String },
	}

	static styles = css`
		:host {
			display: block;
			margin: 2rem 0;
			border-radius: 12px;
			overflow: hidden;
			background: var(--code-bg, #111);
			border: 1px solid var(--border);
		}
		.header {
			background: var(--bg-surface);
			padding: 0.6rem 1.5rem;
			font-size: 0.8rem;
			color: var(--text-secondary);
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
			border-bottom: 1px solid var(--border);
		}
		pre {
			margin: 0;
			padding: 2rem;
			overflow-x: auto;
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
			font-size: 0.9rem;
			line-height: 1.7;
			color: var(--text-primary);
		}
		code {
			white-space: pre;
		}
	`

	render() {
		return html`
			<div class="header">${this.language || 'text'}</div>
			<pre><code>${this.code}</code></pre>
		`
	}
}

customElements.define('ui-code-block', UICodeBlock)

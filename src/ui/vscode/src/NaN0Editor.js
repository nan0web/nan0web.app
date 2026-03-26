import { LitElement, html, css } from 'lit'
import { EditorBridge } from './EditorBridge.js'

/**
 * NaN0 VSCode Editor Component.
 * Acts as a bridge between VS Code and the logic.
 */
export class NaN0Editor extends LitElement {
	static properties = {
		content: { type: Array },
		mode: { type: String },
		uri: { type: String },
	}

	static styles = css`
		:host {
			display: block;
			height: 100vh;
			background: var(--vscode-editor-background, #1e1e1e);
			color: var(--vscode-editor-foreground, #ccc);
			font-family: var(--vscode-editor-font-family, sans-serif);
			padding: 20px;
			box-sizing: border-box;
		}

		.toolbar {
			display: flex;
			gap: 10px;
			margin-bottom: 20px;
			border-bottom: 1px solid var(--vscode-panel-border, #444);
			padding-bottom: 10px;
		}

		button {
			background: var(--vscode-button-background, #007acc);
			color: var(--vscode-button-foreground, #fff);
			border: none;
			padding: 5px 10px;
			cursor: pointer;
		}

		button:hover {
			background: var(--vscode-button-hoverBackground, #0062a3);
		}

		pre {
			background: var(--vscode-textCodeBlock-background, #252526);
			padding: 10px;
			overflow: auto;
			max-height: calc(100vh - 100px);
		}
	`

	#bridge = new EditorBridge()

	constructor() {
		super()
		this.content = []
		this.mode = 'code'
		this.uri = ''

		this.#bridge.onMessage((type, payload) => {
			if (type === 'load') {
				this.content = payload.content
				this.uri = payload.uri
			}
		})

		// Request initial document load
		this.#bridge.send('ready')
	}

	render() {
		return html`
			<div class="toolbar">
				<button @click=${this.#switchMode}>Mode: ${this.mode}</button>
				<button @click=${this.#save}>Save</button>
				<span>${this.uri}</span>
			</div>
			${this.mode === 'code'
				? html`<pre>${JSON.stringify(this.content, null, 2)}</pre>`
				: html`<div>Visual editor coming soon...</div>`}
		`
	}

	#switchMode() {
		this.mode = this.mode === 'code' ? 'visual' : 'code'
	}

	#save() {
		this.#bridge.send('save', { uri: this.uri, content: this.content })
	}
}

customElements.define('nan0-editor', NaN0Editor)

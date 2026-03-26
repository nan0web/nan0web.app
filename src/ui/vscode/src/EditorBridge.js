/**
 * Bridge between VS Code host and Webview.
 * Provides a standardized way to send and receive messages.
 */
export class EditorBridge {
	#vscode

	constructor() {
		// acquireVsCodeApi can only be called once
		this.#vscode = window.acquireVsCodeApi ? acquireVsCodeApi() : null
	}

	/**
	 * Send message to VS Code host
	 * @param {string} type - Message type
	 * @param {any} [payload] - Message payload
	 */
	send(type, payload) {
		if (this.#vscode) {
			this.#vscode.postMessage({ type, code: payload })
		} else {
			console.log('VSCode.postMessage:', type, payload)
		}
	}

	/**
	 * Subscribe to messages from VS Code host
	 * @param {Function} handler - Message handler function
	 * @returns {Function} Unsubscribe function
	 */
	onMessage(handler) {
		const listener = (event) => {
			const { type, code } = event.data
			handler(type, code)
		}
		window.addEventListener('message', listener)
		return () => window.removeEventListener('message', listener)
	}

	/**
	 * Save current editor state to VS Code
	 * @param {any} state - Serialized editor state
	 */
	setState(state) {
		if (this.#vscode) {
			this.#vscode.setState(state)
		}
	}

	/**
	 * Get restored editor state from VS Code
	 * @returns {any} Restored state
	 */
	getState() {
		return this.#vscode ? this.#vscode.getState() : null
	}
}

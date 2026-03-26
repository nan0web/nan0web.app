import * as vscode from 'vscode'

/**
 * @param {vscode.ExtensionContext} context
 */
export function activate(context) {
	console.info('nan0web extension is active')

	// Register Custom Editor Provider
	context.subscriptions.push(NaN0EditorProvider.register(context))

	// Formatting Provider (from previous version)
	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider('nan0', {
			provideDocumentFormattingEdits(document) {
				// ... implementation from memory or to be refined
				return []
			},
		}),
	)
}

/**
 * Provider for NaN0 Visual Editor.
 */
class NaN0EditorProvider {
	static viewType = 'nan0web.editor'

	static register(context) {
		const provider = new NaN0EditorProvider(context)
		return vscode.window.registerCustomEditorProvider(NaN0EditorProvider.viewType, provider)
	}

	constructor(context) {
		this.context = context
	}

	async resolveCustomTextEditor(document, webviewPanel, _token) {
		webviewPanel.webview.options = { enableScripts: true }
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview)

		const updateWebview = () => {
			webviewPanel.webview.postMessage({
				type: 'load',
				code: {
					uri: document.uri.toString(),
					content: this.parseDocument(document.getText()),
				},
			})
		}

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview()
			}
		})

		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose()
		})

		webviewPanel.webview.onDidReceiveMessage((e) => {
			switch (e.type) {
				case 'ready':
					updateWebview()
					return
				case 'save':
					this.updateTextDocument(document, e.code.content)
					return
			}
		})
	}

	getHtmlForWebview(webview) {
		// In production, this would point to the built dist/index.html of ui-vscode
		// For now, we mock the script loading
		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>NaN0 Editor</title>
			</head>
			<body>
				<div id="app"></div>
				<script>
					const vscode = acquireVsCodeApi();
					window.addEventListener('message', event => {
						const message = event.data;
						console.info('Webview received:', message);
					});
					// Mock component loading
					document.getElementById('app').innerHTML = '<h1>NaN0 Editor Webview</h1><p>Waiting for data...</p>';
				</script>
			</body>
			</html>
		`
	}

	parseDocument(text) {
		try {
			return JSON.parse(text) // Minimal version
		} catch {
			return [{ text }]
		}
	}

	updateTextDocument(document, content) {
		const edit = new vscode.WorkspaceEdit()
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			JSON.stringify(content, null, 2),
		)
		return vscode.workspace.applyEdit(edit)
	}
}

export function deactivate() {}

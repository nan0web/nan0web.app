import { WebSocketServer } from 'ws'

/**
 * WebSocket Bridge for NaN0Web App.
 * Facilitates real-time state synchronization and intent delegation between server and clients.
 * 
 * Protocol:
 * - Server -> Client: { type: 'STATE_UPDATED', payload: state }
 * - Client -> Server: { type: 'RESOLVE_INTENT', payload: { src, url, ui } }
 */
export class WebSocketBridge {
	/**
	 * @param {import('../runner.js').AppRunner} runner
	 */
	constructor(runner) {
		this.runner = runner
		/** @type {Set<import('ws').WebSocket>} */
		this.clients = new Set()
		/** @type {WebSocketServer | null} */
		this.wss = null
	}

	/**
	 * Attach the bridge to an existing HTTP/HTTPS server.
	 * @param {import('http').Server | import('https').Server} server
	 */
	attach(server) {
		this.wss = new WebSocketServer({ server })
		
		this.wss.on('connection', (ws) => {
			this.clients.add(ws)
			console.info(`[WS] Client connected. Total: ${this.clients.size}`)

			// Send initial state
			this.#send(ws, { type: 'STATE_SYNC', payload: this.runner.state })

			ws.on('message', async (data) => {
				try {
					const message = JSON.parse(data.toString())
					await this.#handleMessage(ws, message)
				} catch (err) {
					console.error('[WS] Failed to parse message:', err)
				}
			})

			ws.on('close', () => {
				this.clients.delete(ws)
				console.info(`[WS] Client disconnected. Total: ${this.clients.size}`)
			})
		})

		// Listen to runner state changes (if event system implemented)
		if (typeof this.runner.on === 'function') {
			this.runner.on('change', (newState) => {
				this.broadcast({ type: 'STATE_UPDATED', payload: newState })
			})
		}
	}

	/**
	 * Broadcast a message to all connected clients.
	 * @param {object} message 
	 */
	broadcast(message) {
		const data = JSON.stringify(message)
		for (const client of this.clients) {
			if (client.readyState === 1) { // OPEN
				client.send(data)
			}
		}
	}

	/**
	 * @param {import('ws').WebSocket} ws
	 * @param {object} message 
	 */
	#send(ws, message) {
		if (ws.readyState === 1) {
			ws.send(JSON.stringify(message))
		}
	}

	/**
	 * Handle incoming messages from clients.
	 * @param {import('ws').WebSocket} ws
	 * @param {object} message 
	 */
	async #handleMessage(ws, message) {
		switch (message.type) {
			case 'RESOLVE_INTENT': {
				console.info(`[WS] Intent received: ${message.payload.src}`)
				const results = await this.runner.resolveIntent(message.payload)
				this.#send(ws, { 
					type: 'INTENT_RESOLVED', 
					payload: { intent: message.payload, results } 
				})
				break
			}
			case 'PING':
				this.#send(ws, { type: 'PONG' })
				break
			default:
				console.warn(`[WS] Unknown message type: ${message.type}`)
		}
	}

	/**
	 * Shutdown the bridge.
	 */
	stop() {
		if (this.wss) {
			this.wss.close()
			this.wss = null
		}
		this.clients.clear()
	}
}

export default WebSocketBridge

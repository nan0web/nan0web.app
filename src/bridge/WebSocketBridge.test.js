import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createServer } from 'node:http'
import { WebSocketBridge } from './WebSocketBridge.js'
import { AppRunner } from '../runner.js'
// Use native WebSocket (v22+) or 'ws' for client-side testing
import { WebSocket } from 'ws'

describe('WebSocketBridge', () => {
	it('should attach to http server and handle connections', async () => {
		const runner = new AppRunner()
		const bridge = new WebSocketBridge(runner)
		const server = createServer()

		bridge.attach(server)

		await new Promise((resolve) => server.listen(0, resolve))
		const port = server.address().port

		const ws = new WebSocket(`ws://localhost:${port}`)

		const msg = await new Promise((resolve, reject) => {
			ws.on('open', () => console.log('Client connected in test'))
			ws.on('message', (data) => resolve(JSON.parse(data.toString())))
			ws.on('error', reject)
			setTimeout(() => reject(new Error('Timeout waiting for STATE_SYNC')), 1000)
		})

		assert.equal(msg.type, 'STATE_SYNC')

		ws.close()
		bridge.stop()
		server.close()
	})

	it('should relay state changes via EventEmitter', async () => {
		const runner = new AppRunner()
		const bridge = new WebSocketBridge(runner)
		const server = createServer()
		bridge.attach(server)

		await new Promise((resolve) => server.listen(0, resolve))
		const port = server.address().port
		const ws = new WebSocket(`ws://localhost:${port}`)

		// Consume initial STATE_SYNC
		await new Promise((resolve) => ws.on('message', resolve))

		// Wait for next message (State Update)
		const updatePromise = new Promise((resolve) =>
			ws.on('message', (data) => resolve(JSON.parse(data.toString()))),
		)

		// Trigger state change in runner
		runner.updateState('testKey', 'testValue')

		const update = await updatePromise
		assert.equal(update.type, 'STATE_UPDATED')
		assert.equal(update.payload.testKey, 'testValue')

		ws.close()
		bridge.stop()
		server.close()
	})
})

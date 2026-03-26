import { runGenerator, CLiInputAdapter, resolvePositionalArgs } from '@nan0web/ui-cli'
import { parseArgs } from 'node:util'

// Models & Infra
import { ShellModel } from '@nan0web/ui/domain'
import { AppRunner, NaN0WebConfig } from './runner.js'
import { DBwithFSDriver } from '@nan0web/db-fs'
import SSRServer from './server/index.js'
import spawn from './utils/exec.js'

/**
 * NaN0Web CLI — OLMUI Model-Driven Application.
 * 
 * Implements the "Standard" app-level loop where the ShellModel manages
 * the core functionality, and CLI logic is purely declarative.
 */
export async function main() {
	console.info('📡 NaN0Web Engine v3.0 booting...')
	const { values, positionals } = parseArgs({
		args: process.argv.slice(2),
		options: {
			dsn: { type: 'string' },
			port: { type: 'string' },
			locale: { type: 'string' },
			help: { type: 'boolean', short: 'h' },
		},
		strict: false,
	})

	const adapter = new CLiInputAdapter()
	
	// Map CLI positionals to ShellModel fields (command)
	const initialData = resolvePositionalArgs(ShellModel, positionals, values)
	
	if (values.help) initialData.command = 'help'
	
	// Dependency Injection: Pass Node-specific infra to common Models
	const infra = {
		AppRunner,
		SSRServer,
		NaN0WebConfig,
		DBwithFSDriver,
		spawn,
		dsn: values.dsn || 'data/',
		port: values.port,
		locale: values.locale,
	}

	const app = new ShellModel(initialData, infra)

	// OLMUI Execution Loop
	while (true) {
		const res = await runGenerator(app, adapter, infra)
		
		// If user cancelled (Ctrl+C / Esc), exit loop
		if (res.cancelled) break

		// If command was explicitly provided in ARGV, exit after execution
		if (initialData.command) break
		
		// Otherwise (interactive menu), just loop back — ShellModel resets this.command internally
	}
}

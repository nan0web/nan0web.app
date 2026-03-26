import { spawn as nodeSpawn } from 'node:child_process'

/**
 * Standard OLMUI-compatible spawn wrapper.
 * Returns a promise that resolves to the exit code.
 * 
 * @param {string} cmd 
 * @param {string[]} args 
 * @param {Object} [options={}] 
 * @returns {Promise<number>}
 */
export async function spawn(cmd, args = [], options = {}) {
	return new Promise((resolve) => {
		const proc = nodeSpawn(cmd, args, { 
			stdio: options.stdio || 'inherit', 
			shell: true,
			...options 
		})
		
		proc.on('close', (code) => resolve(code ?? 0))
		proc.on('error', () => resolve(1))
	})
}

export default spawn

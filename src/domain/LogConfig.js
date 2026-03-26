import { Model } from '@nan0web/core'

/**
 * Log Configuration Model
 * Controls rotation and format for execution logs (access, errors).
 *
 * @property {boolean} enabled Enable logging
 * @property {string} dir Directory for storing logs
 * @property {'daily'|'hourly'|'size'} rotation Rotation strategy
 * @property {number} maxSizeMb Max size in megabytes (if rotation is 'size')
 * @property {boolean} logBodies Log request payload bodies
 */
export default class LogConfig extends Model {
	static enabled = {
		short: 'e',
		help: 'Enable or disable logging system wide',
		type: 'boolean',
		default: true,
	}

	static dir = {
		short: 'd',
		help: 'Directory to store log files',
		type: 'string',
		default: 'logs/',
	}

	static rotation = {
		short: 'r',
		help: 'File rotation strategy',
		type: 'enum',
		options: ['daily', 'hourly', 'size'],
		default: 'daily',
	}

	static maxSizeMb = {
		short: 's',
		help: 'Max file size in megabytes before rotation (only for size strategy)',
		type: 'number',
		default: 10,
	}

	static logBodies = {
		short: 'b',
		help: 'Whether to log request and response bodies (can blow up storage)',
		type: 'boolean',
		default: false,
	}
}


import * as assert from 'assert'
import * as util from 'util'
import { Logger } from '../../lib/mdplantlib/logger'

suite('Logger Test Suite', () => {
	test('formats quoted arguments without evaluating them', () => {
		const logger = new Logger('test')
		const output: string[] = []
		const originalLog = console.log

		console.log = (...args: Parameters<typeof console.log>) => {
			output.push(util.format(...args))
		}

		try {
			logger.info('%s', 'a "quoted" value')
		} finally {
			console.log = originalLog
		}

		assert.strictEqual(output[0], '[info] [test]: a "quoted" value')
	})
})

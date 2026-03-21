import * as assert from 'assert';
import { parseDocumentStructure, sanitizeDocument } from '../../ConvertToSSM/Util';

suite('Extension Test Suite', () => {
	test('sanitizeDocument removes dangerous prototype keys recursively', () => {
		const input = {
			mainSteps: [
				{
					inputs: {
						runCommand: ['echo ok']
					}
				}
			],
			nested: {
				constructor: {
					prototype: {
						polluted: true
					}
				}
			}
		} as Record<string, unknown>;
		Object.defineProperty(input, '__proto__', {
			configurable: true,
			enumerable: true,
			value: {
				polluted: true
			}
		});

		const sanitized = sanitizeDocument(input) as Record<string, unknown>;
		assert.strictEqual(Object.prototype.hasOwnProperty.call(sanitized, '__proto__'), false);
		assert.strictEqual(Object.prototype.hasOwnProperty.call(sanitized.nested as object, 'constructor'), false);
	});

	/* eslint-disable @typescript-eslint/naming-convention */
	test('parseDocumentStructure accepts valid SSM documents', () => {
		const parsed = parseDocumentStructure({
			schemaVersion: '2.2',
			description: 'safe document',
			parameters: {},
			mainSteps: [
				{
					precondition: {
						StringEquals: ['platformType', 'Linux']
					},
					action: 'aws:runShellScript',
					name: 'RunShellScript',
					inputs: {
						workingDirectory: '',
						timeoutSeconds: '60',
						runCommand: ['echo hello']
					}
				}
			]
		});

		assert.ok(parsed);
		assert.deepStrictEqual(parsed?.mainSteps[0].inputs.runCommand, ['echo hello']);
	});

	test('parseDocumentStructure rejects malformed or unsafe documents', () => {
		const invalid = parseDocumentStructure({
			schemaVersion: '2.2',
			description: 'bad document',
			parameters: {},
			mainSteps: [
				{
					precondition: {
						StringEquals: ['platformType', 'Windows']
					},
					action: 'aws:runPowerShellScript',
					name: 'BadStep',
					inputs: {
						workingDirectory: '',
						timeoutSeconds: '60',
						runCommand: ['ok']
					},
					constructor: {
						prototype: {
							polluted: true
						}
					}
				}
			]
		});

		assert.strictEqual(invalid, undefined);
	});
	/* eslint-enable @typescript-eslint/naming-convention */
});

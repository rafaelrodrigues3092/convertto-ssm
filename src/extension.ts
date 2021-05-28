
import * as vscode from 'vscode';
import { ssmConvert } from './ConvertToSSM/Convert';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('convertto-ssm.converttossmjson', () => { ssmConvert('json'); }));
	context.subscriptions.push(vscode.commands.registerCommand('convertto-ssm.converttoyaml', () => { ssmConvert('yaml');; }));
}
export function deactivate() { }

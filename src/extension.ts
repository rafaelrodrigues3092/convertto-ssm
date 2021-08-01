
import * as vscode from 'vscode';
import { ssmConvert } from './ConvertToSSM/Convert';
import { getScript } from './ConvertToSSM/Revert';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('convertto-ssm.converttossmjson', () => { ssmConvert('json'); }));
	context.subscriptions.push(vscode.commands.registerCommand('convertto-ssm.converttoyaml', () => { ssmConvert('yaml'); }));
	context.subscriptions.push(vscode.commands.registerCommand('convertto-ssm.convertfromssm', () => { getScript(); }));
}
export function deactivate() { }

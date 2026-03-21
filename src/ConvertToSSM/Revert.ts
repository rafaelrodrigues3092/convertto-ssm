import * as vscode from 'vscode';
import { openNewFile, validateDocumentType, DocumentStructure, isAutoCopyEnabled, copyToClipboard, parseDocumentStructure } from './Util';
const yaml = require('js-yaml');

function parseAndValidateDocument(parsedDocument: unknown, sourceType: 'JSON' | 'YAML'): DocumentStructure | undefined {
  const validatedDocument = parseDocumentStructure(parsedDocument);
  if (!validatedDocument) {
    vscode.window.showErrorMessage(`Failed to convert script from ${sourceType}: unsupported or unsafe SSM document structure`);
    return undefined;
  }

  return validatedDocument;
}

function fromJson(script: string): DocumentStructure | undefined {
  try {
    const parsedDocument = JSON.parse(script) as unknown;
    return parseAndValidateDocument(parsedDocument, 'JSON');
  }
  catch (e) {
    vscode.window.showErrorMessage('Failed to convert script from JSON');
    console.error(e);
    return undefined;
  }
}

function fromYaml(script: string): DocumentStructure | undefined {

  try {
    const parsedDocument = yaml.load(script) as unknown;
    return parseAndValidateDocument(parsedDocument, 'YAML');
  }
  catch (e) {
    vscode.window.showErrorMessage('Failed to convert script from YAML');
    console.error(e);
    return undefined;
  }
}

export function getScript() {

  const content: string = vscode.window.activeTextEditor?.document ? vscode.window.activeTextEditor.document.getText() : '';
  const languageid: string = vscode.window.activeTextEditor?.document.languageId ? vscode.window.activeTextEditor.document.languageId : '';
  const autoCopy = isAutoCopyEnabled();

  if (validateDocumentType(languageid)) {
    if (content === '') {
      openNewFile('');
      return;
    }

    const ssmObject = languageid === 'yaml' ? fromYaml(content) : fromJson(content);
    if (!ssmObject) {
      return;
    }

    ssmObject.mainSteps.forEach((step) => {
      let target: string | undefined;
      let finalScript: string | undefined;

      if (step.action === 'aws:runShellScript') {
        target = 'shellscript';
        finalScript = step.inputs.runCommand?.join('\n');
      }
      else if (step.action === 'aws:runPowerShellScript') {
        target = 'powershell';
        finalScript = step.inputs.runCommand?.join('\r\n');
      }
      else {
        vscode.window.showErrorMessage('SSM action is neither aws:runPowerShellScript nor aws:runShellScript');
        console.log(`SSM action ${step.action} is not supported`);
        return;
      }

      const outScript: string = finalScript ? finalScript : '';

      if (autoCopy) {
        copyToClipboard(outScript);
      }
      openNewFile(outScript, target);
    });
  }
}

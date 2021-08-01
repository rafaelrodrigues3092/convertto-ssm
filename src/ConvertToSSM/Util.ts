import * as vscode from 'vscode';

export function getDocumentIndent(): number {

  const workspaceConfig = vscode.workspace.getConfiguration('editor');
  if (workspaceConfig && workspaceConfig.get('insertSpaces')) { //if insert spaces is true
    const tabSize = workspaceConfig.get('tabSize'); //get tabsize
    if (tabSize && typeof tabSize === 'number') { //ensure tabsize is indeed a number
      return tabSize;
    }
  }
  return 4;
}


function getExtensionConfig(): any {
  let extensionConfig = vscode.workspace.getConfiguration('convertto-ssm');
  if (extensionConfig) {
    return extensionConfig;
  }
  return {};
}

export function isAutoCopyEnabled(): boolean {
  let extensionConfig = getExtensionConfig();
  if (extensionConfig && extensionConfig.get('EnableAutoCopyToClipboard')) { //if insert spaces is true
    let autoCopyEnabled = extensionConfig.get('EnableAutoCopyToClipboard') ;
    if (autoCopyEnabled && typeof autoCopyEnabled === 'boolean'){
      return autoCopyEnabled;
    }
  }
  return false;
}

export function copyRunCommandOnly(): boolean {
  let extensionConfig = getExtensionConfig();
  if (extensionConfig && extensionConfig.get('EnableCopyRunCommandOnly')) { //if insert spaces is true
    let copyRunCmd = extensionConfig.get('EnableCopyRunCommandOnly') ;
    if (copyRunCmd && typeof copyRunCmd === 'boolean'){
      return copyRunCmd;
    }
  }
  return false;
}


export function openNewFile(content: string, language: string = 'json') {
  vscode.workspace.openTextDocument({
    language: language
  })
    .then(doc => vscode.window.showTextDocument(doc))
    .then(editor => {
      editor.edit((editBuilder: vscode.TextEditorEdit) => {
        editBuilder.insert(new vscode.Position(0, 0), content);
      });
    });
}

export function copyToClipboard(content: string){
  vscode.env.clipboard.writeText(content);
}

export function validate(languageId: string): boolean {
  if (!(['powershell', 'shellscript'].includes(languageId))) {
    vscode.window.showErrorMessage('Only PowerShell and Shell scripts supported :(');
    return false;
  }
  else {
    return true;
  }
}

export function validateScriptType(languageId: string): boolean {
  if (!(['powershell', 'shellscript'].includes(languageId))) {
    vscode.window.showErrorMessage('Only PowerShell and Shell scripts supported :(');
    return false;
  }
  else {
    return true;
  }
}


export function validateDocumentType(languageId: string): boolean {
  if (!(['json', 'yaml'].includes(languageId))) {
    vscode.window.showErrorMessage('Only JSON and YAML SSM documents supported :(');
    return false;
  }
  else {
    return true;
  }
}


export interface DocumentStructure {
  schemaVersion: string;
  description: string;
  parameters: Object;
  mainSteps: [{
    precondition: {
      StringEquals: string[];
    };
    action: string;
    name: string;
    inputs: {
      workingDirectory: string;
      timeoutSeconds: string;
      runCommand?: string[];
    }
  }];
}

export const defaultDoc: DocumentStructure = {
  "schemaVersion": "2.2",
  "description": "Document Description",
  "parameters": {
    "sampleParameter": {
      "type": "String",
      "description": "SampleParameter description",
      "default": "defaultParamValue"
    }
  },
  "mainSteps": [
    {
      "precondition": {
        "StringEquals": [
          "platformType",
          "Windows"
        ]
      },
      "action": "aws:runPowerShellScript",
      "name": "StepName",
      "inputs": {
        "workingDirectory": "",
        "timeoutSeconds": "400",
        "runCommand": undefined
      }
    }
  ]
};
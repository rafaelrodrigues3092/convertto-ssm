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

export function validate(languageId: string): boolean {
  if (!(['powershell', 'shellscript'].includes(languageId))) {
    vscode.window.showErrorMessage('Only PowerShell and Shell scripts supported :(');
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
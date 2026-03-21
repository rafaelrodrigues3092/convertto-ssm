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


function getExtensionConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration('convertto-ssm');
}

export function isAutoCopyEnabled(): boolean {
  const extensionConfig = getExtensionConfig();
  const autoCopyEnabled = extensionConfig.get<boolean>('EnableAutoCopyToClipboard');
  return autoCopyEnabled === true;
}

export function copyRunCommandOnly(): boolean {
  const extensionConfig = getExtensionConfig();
  const copyRunCmd = extensionConfig.get<boolean>('EnableCopyRunCommandOnly');
  return copyRunCmd === true;
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

/* eslint-disable @typescript-eslint/naming-convention */
export interface DocumentStructure {
  schemaVersion: string;
  description: string;
  parameters: Record<string, unknown>;
  mainSteps: Array<{
    precondition: {
      StringEquals: string[];
    };
    action: string;
    name: string;
    inputs: {
      workingDirectory: string;
      timeoutSeconds: string;
      runCommand?: string[];
    };
  }>;
}
/* eslint-enable @typescript-eslint/naming-convention */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasUnsafeKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(item => hasUnsafeKey(item));
  }

  if (!isPlainObject(value)) {
    return false;
  }

  return Object.keys(value).some(key => (
    key === '__proto__'
    || key === 'constructor'
    || key === 'prototype'
    || hasUnsafeKey(value[key])
  ));
}

export function sanitizeDocument(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeDocument(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const sanitized = Object.create(null) as Record<string, unknown>;
  Object.entries(value).forEach(([key, nestedValue]) => {
    if (!['__proto__', 'constructor', 'prototype'].includes(key)) {
      sanitized[key] = sanitizeDocument(nestedValue);
    }
  });

  return sanitized;
}

/* eslint-disable @typescript-eslint/naming-convention */
export function parseDocumentStructure(value: unknown): DocumentStructure | undefined {
  if (hasUnsafeKey(value)) {
    return undefined;
  }

  const document = sanitizeDocument(value);
  if (!isPlainObject(document)) {
    return undefined;
  }

  const { schemaVersion, description, parameters, mainSteps } = document;
  if (typeof schemaVersion !== 'string' || typeof description !== 'string' || !isPlainObject(parameters) || !Array.isArray(mainSteps)) {
    return undefined;
  }

  const parsedSteps = mainSteps.map(step => {
    if (!isPlainObject(step) || !isPlainObject(step.precondition) || !Array.isArray(step.precondition.StringEquals) || !isPlainObject(step.inputs)) {
      return undefined;
    }

    if (typeof step.action !== 'string' || typeof step.name !== 'string' || typeof step.inputs.workingDirectory !== 'string' || typeof step.inputs.timeoutSeconds !== 'string') {
      return undefined;
    }

    const runCommand = step.inputs.runCommand;
    if (runCommand !== undefined && (!Array.isArray(runCommand) || !runCommand.every(line => typeof line === 'string'))) {
      return undefined;
    }

    if (!step.precondition.StringEquals.every(value => typeof value === 'string')) {
      return undefined;
    }

    return {
      precondition: {
        StringEquals: [...step.precondition.StringEquals]
      },
      action: step.action,
      name: step.name,
      inputs: {
        workingDirectory: step.inputs.workingDirectory,
        timeoutSeconds: step.inputs.timeoutSeconds,
        runCommand: runCommand ? [...runCommand] : undefined
      }
    };
  });

  if (parsedSteps.some(step => step === undefined)) {
    return undefined;
  }

  return {
    schemaVersion,
    description,
    parameters: { ...parameters },
    mainSteps: parsedSteps as DocumentStructure['mainSteps']
  };
}
/* eslint-enable @typescript-eslint/naming-convention */

/* eslint-disable @typescript-eslint/naming-convention */
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
/* eslint-enable @typescript-eslint/naming-convention */

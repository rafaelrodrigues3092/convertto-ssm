import * as vscode from 'vscode';
import {  openNewFile, validateDocumentType, DocumentStructure } from './Util';
const yaml = require('js-yaml');


function fromJson(script: string): DocumentStructure | undefined {
  try {
    return JSON.parse(script);
  }
  catch (e) {
    vscode.window.showErrorMessage('Failed to convert script from JSON');
    console.error(e);
    return undefined;
  }
}

function fromYaml(script: string): DocumentStructure | undefined {

  try {
    return yaml.load(script);
  }
  catch (e) {
    vscode.window.showErrorMessage('Failed to convert script from YAML');
    console.error(e);
    return undefined;
  }
}


export function getScript() {

  let content: string = vscode.window.activeTextEditor?.document ? vscode.window.activeTextEditor.document.getText() : "";
  let languageid: string = vscode.window.activeTextEditor?.document.languageId ? vscode.window.activeTextEditor.document.languageId : "";


  if (validateDocumentType(languageid)) {
    if (content === null || content === "") {
      openNewFile("");
      return;
    }
    else {

      let finalScript: string | undefined;
      let ssmObject: DocumentStructure | undefined;
      let target: string;

      //if it's a shell script change the environment and the action
      if (languageid === 'yaml') {
        ssmObject = fromYaml(content);
      }
      else {
        ssmObject = fromJson(content);
      }

      if (ssmObject) {
        ssmObject['mainSteps'].forEach(function (step) {

          if (step['action'] === 'aws:runShellScript') {
            target = 'shellscript';
            finalScript = step.inputs.runCommand?.join('/\n/');
          }
          else if (step['action'] === 'aws:runPowerShellScript') {
            target = 'powershell';
            finalScript = step.inputs.runCommand?.join('/\r\n/');
          }
          else {
            vscode.window.showErrorMessage('SSM action is neither aws:runPowerShellScript nor aws:runShellScript');
            console.log(`SSM action ${step['action']} is not supported`);
            return; //continue
          }

          openNewFile(finalScript ? finalScript : '', target);
        });

      }



    }
  }

}
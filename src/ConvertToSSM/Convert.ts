import * as vscode from 'vscode';
import { defaultDoc, getDocumentIndent,isAutoCopyEnabled,copyRunCommandOnly,copyToClipboard, openNewFile, validate, DocumentStructure } from './Util';
const yaml = require('js-yaml');

function toJson(script: string[], root?: DocumentStructure): string {
  try {
    if(root) {
      root['mainSteps'][0]['inputs']['runCommand'] = script;
      return JSON.stringify(root, null, getDocumentIndent());
    } else {
      return JSON.stringify(script, null, getDocumentIndent());
    }

  }
  catch (e) {
    vscode.window.showErrorMessage('Failed to convert script to JSON');
    console.error(e);
    return "";
  }
}

function toYaml(script: string[], root?: DocumentStructure): string {

  let indent: number = getDocumentIndent();
  let dumpOptions = {
    quotingType: '"',
    indent: indent,
    styles: {
      '!!null': 'lowercase'
    }
  };

  try {

    //return (yaml.dump(root, dumpOptions));
    let rows = script.map(row => { return (`${' '.repeat(5 * indent)}${row}`); }).join('\r\n');
    if(root) {
      return (
        yaml.dump(root, dumpOptions) +
        (`${' '.repeat(3 * indent)}runCommand:`) + //because by default runCommand is undefined, it's removed when when running yaml.dump
        (`\r\n${' '.repeat(4 * indent)}- |`) +
        ("\r\n" + rows)
      );
    } else {
      return(yaml.dump(rows, dumpOptions));
    }


  }
  catch (e) {
    vscode.window.showErrorMessage('Failed to convert script to YAML');
    console.error(e);
    return "";
  }
}

export function ssmConvert(target: string) {

  let content: string = vscode.window.activeTextEditor?.document ? vscode.window.activeTextEditor.document.getText() : "";
  let languageid: string = vscode.window.activeTextEditor?.document.languageId ? vscode.window.activeTextEditor.document.languageId : "";
  //LF = 1
  //CRLF = 2
  let eol = vscode.window.activeTextEditor?.document.eol ? vscode.window.activeTextEditor.document.eol : 2;
  let autoCopy = isAutoCopyEnabled();


  if (validate(languageid)) {
    if (content === null || content === "") {
      openNewFile("");
      return;
    }
    else {

      let rootDoc = JSON.parse(JSON.stringify(defaultDoc)); //deep copy object

      //if it's a shell script change the environment and the action
      if (languageid === 'shellscript') {
        rootDoc['mainSteps'][0]['action'] = "aws:runShellScript";
        rootDoc['mainSteps'][0]['precondition']['StringEquals'][1] = "Linux";
      }

      let splitContent: string[];
      let finalSSM: string;
      let runCmdOnly: string;

      //split content accordingly
      if (eol === 1) { //LF
        splitContent = content.split(/\n/);
      }
      else { //CRLF
        splitContent = content.split(/\r\n/);
      }

      //convert to target document
      if (target === 'yaml') {
        finalSSM = toYaml(splitContent, rootDoc);
        runCmdOnly = toYaml(splitContent);
      }
      else {
        finalSSM = toJson(splitContent, rootDoc);
        runCmdOnly = toJson(splitContent);
      }

      if(autoCopy) {
        let copyCmdOnly = copyRunCommandOnly();
        if(copyCmdOnly) {
          copyToClipboard(runCmdOnly);
        }
        else {
          copyToClipboard(finalSSM);
        }
      }

      openNewFile(finalSSM, target);
    }
  }

}
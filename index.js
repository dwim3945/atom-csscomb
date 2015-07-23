'use babel';

import fs          from 'fs';
import path        from 'path';
import CSSBeautify from 'cssbeautify';
import CSSComb     from 'csscomb';

const directory      = atom.project.getDirectories().shift();
const userConfigPath = directory ? directory.resolve('.csscomb.json') : '';
const atomConfigPath = path.join(__dirname, './csscomb.json');

export let config = {
  configureWithPreset: {
    title: 'Configure with preset',
    description: 'Configure with preset config.',
    type: 'string',
    default: 'csscomb',
    enum: ['csscomb', 'zen', 'yandex']
  },
  configureWithJSON: {
    title: 'Configure with JSON',
    description: 'Configure with JSON file in the current directory.',
    type: 'boolean',
    default: false
  },
  executeOnSave: {
    title: 'Execute on save',
    description: 'Execute sorting CSS property on save.',
    type: 'boolean',
    default: false
  },
  indentType: {
    title: 'Indent Type',
    type: 'string',
    default: 'space',
    enum: ['space', 'tab']
  },
  indentSize: {
    title: 'Indent Size',
    type: 'number',
    default: 2
  }
};

const configureWithPreset = () => atom.config.get('atom-csscomb.configureWithPreset');
const configureWithJSON   = () => atom.config.get('atom-csscomb.configureWithJSON');
const executeOnSave       = () => atom.config.get('atom-csscomb.executeOnSave');
const indentType          = () => atom.config.get('atom-csscomb.indentType');
const indentSize          = () => atom.config.get('atom-csscomb.indentSize');

const execute = () => {

  const editor = atom.workspace.getActiveTextEditor();

  if (!editor) {
    return;
  }

  let text = editor.getText();
  let selectedText = editor.getSelectedText();

  let configJSON = null;
  let presetType = configureWithPreset();

  if (configureWithJSON()) {
    if (fs.existsSync(userConfigPath)) {
      configJSON = require(userConfigPath);
    } else if (fs.existsSync(atomConfigPath)) {
      configJSON = require(atomConfigPath);
    }
  }

  if (!configJSON) {
    configJSON = CSSComb.getConfig(presetType);
  }
  console.log(configJSON);

  let csscomb = new CSSComb();
  csscomb.configure(configJSON);

  let grammer = editor.getGrammar().name.toLowerCase();
  let syntax = grammer || 'css';

  let indent = '';
  switch (indentType()) {
    case 'space':
      indent = Array(indentSize() + 1).join(' ');
      break;
    case 'tab':
      indent = '\t';
      break;
  }

  if (selectedText.length !== 0) {
    try {
      selectedText = csscomb.processString(selectedText, {
        syntax: syntax
      });
      editor.setTextInBufferRange(
        editor.getSelectedBufferRange(),
        CSSBeautify(selectedText, {
          indent: indent
        })
      );
    } catch (e) {}
  } else {
    try {
      text = csscomb.processString(text, {
        syntax: syntax
      });
      editor.setText(
        CSSBeautify(text, {
          indent: indent
        })
      )
    } catch (e) {}
  }
};

let editorObserver = null;

export const activate = (state) => {
  atom.commands.add('atom-workspace', 'atom-csscomb:execute', () => {
    execute();
  });
  editorObserver = atom.workspace.observeTextEditors((editor) => {
    editor.getBuffer().onWillSave(() => {
      if (executeOnSave()) {
        execute();
      }
    });
  });
};

export const deactivate = () => {
  editorObserver.dispose();
};

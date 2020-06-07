# Policy Models Support for Visual Studio Code <!-- omit in toc -->

## Overview <!-- omit in toc -->

This plugin adds support for **Policy Model** languages in **Visual Studio Code** (more about Policy Models can be found [here](https://datatagginglibrary.readthedocs.io/en/latest/index.html#)).
This project is composed from an **LSP Client** and **LSP Server**.
Both the Client and Server use **Tree-Sitter** Parsers to parse the languages (the client uses it for syntax highlighting and the server for the rest of the language features).



[![Build Status](https://travis-ci.org/wolfj123/PolicyModelsPlugin.svg?branch=master)](https://travis-ci.org/wolfj123/PolicyModelsPlugin)

#### Table of contents  <!-- omit in toc -->

- [Installation](#installation)
- [Features](#features)
	- [Syntax Highlighting](#syntax-highlighting)
	- [Go To References](#go-to-references)
	- [Go To Definition](#go-to-definition)
	- [Auto-Complete](#auto-complete)
	- [Create New Model](#create-new-model)
	- [Running Model](#running-model)
	- [Localization](#localization)
	- [Graphviz Visualization](#graphviz-visualization)
- [Supported Settings](#supported-settings)
- [Development Guide](#development-guide)
- [Related](#related)


## Installation
[TODO: wait for packaging and release]

## Features
### Syntax Highlighting
![syntax highlighting](./docs/images/syntax_highlighting.png)

### Go To References
We support references of Decision Graph nodes (that have an ID), Policy Space slots and Policy Space slot-values.
 
![go to references](./docs/images/references.gif)

### Go To Definition
We support definitions of Decision Graph nodes (that have an ID), Policy Space slots and Policy Space slot-values.
 
![go to definition](./docs/images/definition.gif)

### Auto-Complete
Press **ctrl + space** (default VSCode shortcut) to recieve a completion list. The completion list includes keywords dependant on the file type, Decision Graph nodes (from imported graph files), slots and slot-values.
![autocomplete](./docs/images/autocomplete.png)

### Create New Model
Press the **New Model** button and fill out the necessary information.

[TODO: add images]

### Running Model
Press the **Run Model** button.
[TODO: add images]

### Localization

Pressing the Localization will open our Localization GUI.
If a Localization folder does not already exist, you will promped to first create one.

![localization button](./docs/images/localization_button.png)

The Localization GUI allows for simple editing of the **answers.txt** and **space.md** files:

![localization answers gui](./docs/images/localization_gui.gif)

![localization space gui](./docs/images/localization_space_file.png)


We also provide a Markdown preview of the markdown files of the localization:

![localization space gui](./docs/images/localization_markdown_preview.png)


### Graphviz Visualization
[TODO: add images & description]

## Supported Settings
[TODO: add images]

## Development Guide

## Related

- [Policy Models](https://datatagginglibrary.readthedocs.io/en/latest/index.html#)
- [DataTaggingLibrary project](https://github.com/IQSS/DataTaggingLibrary)
- [LSP](https://microsoft.github.io/language-server-protocol/overviews/lsp/overview/)
- [VSCode Language Extensions](https://code.visualstudio.com/api/language-extensions/overview)
- [Tree-Sitter](http://tree-sitter.github.io/tree-sitter/)
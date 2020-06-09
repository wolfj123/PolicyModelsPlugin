# Policy Models Support for Visual Studio Code <!-- omit in toc -->

## Overview <!-- omit in toc -->

This plugin adds support for **Policy Model** languages in **Visual Studio Code** (more about Policy Models can be found [here](https://datatagginglibrary.readthedocs.io/en/latest/index.html#)).
This project is composed from an **LSP Client** and **LSP Server**.
Both the Client and Server use **Tree-Sitter** Parsers to parse the languages (the client uses it for syntax highlighting and the server for the rest of the language features).



[![Build Status](https://travis-ci.org/wolfj123/PolicyModelsPlugin.svg?branch=master)](https://travis-ci.org/wolfj123/PolicyModelsPlugin)

#### Table of contents  <!-- omit in toc -->

- [Installation](#installation)
	- [Pre-requisites](#pre-requisites)
	- [Instructions](#instructions)
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
- [Development & Contribution Guide](#development--contribution-guide)
- [Related](#related)


## Installation
[TODO: wait for packaging and release]

### Pre-requisites
- **VSCode 1.41** : last compatible version verified.
- **Java JDK 11.0.4** : required for creating [new models](#create-new-model), [running existing models](#running-model) and [localization files creation](#localization).
- **Graphviz**: required for [visualization feature](#graphviz-visualization). Can be download [here](#http://www.graphviz.org/).


### Instructions

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
Press the **New Model** button:

![run model](./docs/images/new_model_button.png.png)

Next fill out the necessary information:

![run model](./docs/images/new_project_window.png)


### Running Model
Press the **Run Model** button:

![run model](./docs/images/run_model_button.png)

This will run the [CLI](https://datatagginglibrary.readthedocs.io/en/latest/take-for-spin.html) and load the model into it:

![run model](./docs/images/cli.png)

### Localization

Pressing the Localization will open our Localization GUI.
If a Localization folder does not already exist, you will promped to first create one.

![localization button](./docs/images/localization_button.png)

The Localization GUI allows for simple editing of the "**answers.txt**" and "**space.md**" files:

![localization answers gui](./docs/images/localization_gui.gif)

![localization space gui](./docs/images/localization_space_file.png)


We also provide a Markdown preview of the markdown files of the localization:

![localization space gui](./docs/images/localization_markdown_preview.png)


### Graphviz Visualization
It is possible to create a graphical visualization of the model using Graphviz (must be pre-installed).
There are 2 kinds of visualizations:
- Decision Graph visualization
- Policy Space visualization

Each has correpsonding button in the plugin:

![visualization buttons](./docs/images/visualization_buttons.png)

After pressing the button, provide the path to the graphviz application, name of generated file and type (pdf, svg, ):

![graphviz path](./docs/images/dot_path_example.png)

This will generate the file under a new "visualization" folder:

![graphviz path](./docs/images/visualization_folder.png)
![graphviz path](./docs/images/graph_visualization.png)


## Supported Settings
[TODO: add images]

## Development & Contribution Guide

[TODO: link page]

## Related

- [Policy Models](https://datatagginglibrary.readthedocs.io/en/latest/index.html#)
- [DataTaggingLibrary Project](https://github.com/IQSS/DataTaggingLibrary)
- [LSP](https://microsoft.github.io/language-server-protocol/overviews/lsp/overview/)
- [VSCode Language Extensions](https://code.visualstudio.com/api/language-extensions/overview)
- [Tree-Sitter](http://tree-sitter.github.io/tree-sitter/)
- [Syntax Highlighting in VSCode using Tree-Sitter](https://github.com/georgewfraser/vscode-tree-sitter)
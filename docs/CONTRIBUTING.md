# Contributing <!-- omit in toc -->

#### Table of contents  <!-- omit in toc -->

- [Read This Before Contributing!](#read-this-before-contributing)
	- [VSCode Language Extensions](#vscode-language-extensions)
	- [Language Server Protocol](#language-server-protocol)
	- [Tree-Sitter](#tree-sitter)
- [Expanding the LSP Client](#expanding-the-lsp-client)
	- [Syntax Coloring](#syntax-coloring)
- [Expanding the LSP Server](#expanding-the-lsp-server)
	- [Language Services](#language-services)
- [Expanding the Language Parsers](#expanding-the-language-parsers)


## Read This Before Contributing!
This project is a VSCode language extension that uses the LSP architecture.
Therefore before any contributions can be made, it is important to first familiarize yourself with the following information: 

### VSCode Language Extensions  
Learn about [VSCode Language Extensions](https://code.visualstudio.com/api/language-extensions/overview).

### Language Server Protocol  
Learn about [LSP](https://microsoft.github.io/language-server-protocol/overviews/lsp/overview/).
There is also a good [example-project](#https://github.com/Microsoft/vscode-extension-samples/tree/master/lsp-sample) that contains both a client and server.

### Tree-Sitter 
Learn about [Tree-Sitter](http://tree-sitter.github.io/tree-sitter/) and our language [parsers](./../README.md#Decision-Graph-Parser).

In this project we use the **web-tree-sitter** project (can be found at https://www.npmjs.com/package/web-tree-sitter) to generate the parsers in _.wasm_ format. The parsers are located in the _Parsers_ directory under root. Both the client and server use this directory. Therefore if anyone wishes to use only one of them, it is necessary to also include the parsers in the new project.

## Expanding the LSP Client

### Syntax Coloring
Syntax coloring in VSCode uses Text-Mate grammers (as described [here](#https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)). **However**, for easier maintainability we wanted to use our Tree-Sitter parsers for the syntax coloring, instead of having to maintain 2 different grammers.
Our syntax coloring is heavily inspired by the works in this [project](https://github.com/georgewfraser/vscode-tree-sitter).
Our coloring functions are located [here](./client/color/../../../client/src/color/colors.ts). There is a coloring function for each language which maps different syntax nodes to different color themes.


## Expanding the LSP Server

### Language Services

To answer LSP requests we have implemented language features which can be found in the following files:
- [LanguageUtils](../server/src/LanguageUtils.ts)
- [LanguageServices](../server/src/LanguageServices.ts)
**LanguageUtils** holds a collection of static methods that store no information and cause no side-effects. They answer basic queries on a given syntax tree.
**LanguageServices** composes the methods mentioned above to answer more complicated queries regarding several syntax trees.
 

## Expanding the Language Parsers

Our parsers are made using [Tree-sitter](#tree-sitter). You must first familirize yourself with creating such parsers.
If you want to modify the language parsers, look at the  repositories of the [parsers](./../README.md#Decision-Graph-Parser).
After changing the parser projects, the WebAssembly parsers in the _Parsers_ directory must be updated as well. There is a [script](./../scripts/gen-parsers.sh) for that, however it currently only works on **Linux**.
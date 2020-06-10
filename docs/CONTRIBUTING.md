# Contributing <!-- omit in toc -->

#### Table of contents  <!-- omit in toc -->

- [Read This Before Contributing!](#read-this-before-contributing)
	- [VSCode Language Extensions](#vscode-language-extensions)
	- [Language Server Protocol](#language-server-protocol)
	- [Tree-Sitter](#tree-sitter)
- [Expanding the LSP Client](#expanding-the-lsp-client)
- [Expanding the LSP Server](#expanding-the-lsp-server)
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
Learn about [Tree-Sitter](http://tree-sitter.github.io/tree-sitter/).
The Tree-Sitter parsers we use:
- [Decision Graph Parser][1].
- [Policy Space Parser][2].
- [Value Inference Parser][3].

[1]:(#https://www.npmjs.com/package/tree-sitter-decisiongraph)
[2]:(#https://www.npmjs.com/package/tree-sitter-policyspace)
[3]:(#https://www.npmjs.com/package/tree-sitter-valueinference)

In this project we use the [web-tree-sitter](#https://www.npmjs.com/package/web-tree-sitter) project to generate the parsers in _.wasm_ format. The parser are located in the _Parsers_ directory under root. Both the client and server use this directory. Therefore if anyone wishes to use only one of them, it is necessary to also include the parsers in the new project.

## Expanding the LSP Client



## Expanding the LSP Server



## Expanding the Language Parsers

If you want to modify the language parsers, please fork the git repositories of the [parsers](#Tree-Sitter).
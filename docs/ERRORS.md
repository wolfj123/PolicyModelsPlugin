# Understanding Errors <!-- omit in toc -->

#### Table of contents  <!-- omit in toc -->
- [Syntax Errors](#syntax-errors)


## Syntax Errors
Due to limitations on error handling in Tree-Sitter, it is currently not possible to provide meaningful error descriptions when the Model has syntax errors. For that reason we do not enable by default our [LSP diagnostics](#https://microsoft.github.io/language-server-protocol/specification#diagnostic), as it is rather bare-bones right now.

If you wish to enable them in your Model, please see instructions [here](../README.md#supported-settings).
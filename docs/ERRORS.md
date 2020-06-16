# Understanding Errors <!-- omit in toc -->

#### Table of contents  <!-- omit in toc -->
- [Syntax Errors](#syntax-errors)
- [Logging](#Logging)
- [LibServiceApp Request](#LibServiceApp-Requests)
- [Generating New Model](#Generating-New-Model)

## Syntax Errors
Due to limitations on error handling in Tree-Sitter, it is currently not possible to provide meaningful error descriptions when the Model has syntax errors. For that reason we do not enable by default our [LSP diagnostics](#https://microsoft.github.io/language-server-protocol/specification#diagnostic), as it is rather bare-bones right now.

If you wish to enable them in your Model, please see instructions [here](../README.md#supported-settings).

## Logging
The logging in the server is based on [Winston logger](https://www.npmjs.com/package/winston). By deafault logging is disabled to activate look [here](./../README.md/#Plugin-Logging).
When activating logging you can have only one istance of VScode open with logging activated.

## LibServiceApp Requests
The features: [grpah visualization](./../README.md/#graphviz-visualization), [localization file creation](./../README.md/#localization) and [new model creation](./../README.md/#create-new-model) are all HTTP requests to a java server ([server code](./../LibServiceApp), [server Jar](./../cli/LibServiceApp.jar).

Any errors regarding connection issues or HTTP requests failures are connected to this files and code. Most common cause to this kind of problems is bad Java JDK installation or Path settings, for installation instructions look [here](./../README.md/#installation).

To make sure Java is set correctly run the Java server by yourself from command line by entering Java -jar LibServiceApp.jar command when in cli folder. If the activation server worked you should see a print of ready with some port number.

Common Issuses:
- class not loaded error - this means when generating the [LibServiceApp Jar](./CONTRIBUTING.md/#LibServiceAPP) the jars in the resources folder weren't added as dependencies to the jar.

## Generating New Model
Generating new model is based on [Policymodel tools JAR](https://github.com/IQSS/DataTaggingLibrary) version 1.9.9.
If you get any unknown error when trying to create a new model is suggested trying to create a new model manually by using [PolicyModels-1.9.9.uber.jar](./../LibServiceApp/resources/PolicyModels-1.9.9.uber.jar), this will allow getting more extensive error messages.

Known Problems When Generating New Model:
- Using non existing path
- Using spaces or numbers in root slot name
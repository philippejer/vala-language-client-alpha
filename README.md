# Visual Studio Code extension for a Vala Language Server

Client extension for this Language Server for the [Vala](https://wiki.gnome.org/Projects/Vala) language: https://github.com/philippejer/vala-language-server-alpha

Note that the syntax highlighting in the example below is provided by this extension: https://marketplace.visualstudio.com/items?itemName=philippejer.vala-grammar

## Supported language server features

![Demo](https://github.com/philippejer/vala-language-client-alpha/raw/master/images/demo.gif?raw=true)

The following features work reasonably well:

* Go to definition (code navigation)
* Mouse hover (symbol declaration)
* Document symbols (outline)
* Find references / symbol rename (rename support is limited, use with care)
* Code completion (crude and hack-ish but still fairly fast and usable in common situations)

## Troubleshooting

### Build file

A common issue is that the language server requires Meson 0.50+ in the `PATH` **and** that the build directory needs to exist (the server uses the intropection feature of Meson to determine the source files and compiler switches).

2019-10-20: A fallback is now available by adding a `vala-language-server.json` configuration file under the project root directory. This file will be detected and used to configure the list of sources files and/or directories and the compiler parameters (it is possible to simply copy the Vala compiler command line from e.g. `compile_commands.json`). An example configuration can be found [here](https://github.com/philippejer/vala-language-server-alpha/blob/master/vala-language-server-test.json).

### Tiny completion snippets

For some reason, a still unresolved issue in VSCode is the tiny completion snippets, see [this issue](https://github.com/microsoft/vscode/issues/29126).

A "dirty" but functional solution is to use [this extension](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css) to load a custom CSS, with the following configuration:

```json  
  "vscode_custom_css.imports": ["https://raw.githubusercontent.com/philippejer/vala-language-client-alpha/master/wider-snippets.css"],
  "vscode_custom_css.policy": true,
```

Do not forget to restart VSCode as admin and run the "Reload Custom CSS and JS" command.

## Configuration

There are a few useful configuration settings:

* `vls.path.server` -> path to the `vala-language-server` executable (not required if in the `PATH`)
* `vls.trace.server ("off"|"messages"|"verbose")` -> debug traces for the client/server communication
* `vls.debug.server ("off"|"warn"|"info"|"debug")` -> debug level for the server itself
* `editor.wordBasedSuggestions (true|false)` -> set to false to avoid having text-based completion when the server cannot provide completion (confusing)
* `editor.quickSuggestionsDelay (milliseconds)` -> can be set to some high value to effectively disable the automatic completion popup for global symbols (completion can then be invoked on demand via the CTRL+SPACE shortcut, can be useful if completion popups are annoying)
* `editor.suggestOnTriggerCharacters (true|false)` -> set to false to disable the automatic completion popup when the 'dot' character is typed (completion can then be invoked on demand via the CTRL+SPACE shortcut, can be useful if completion popups are annoying)
* `editor.hover.delay (milliseconds)` -> the default value of 300 milliseconds can be a little too low

Typical configuration:

```json
"vls.debug.server": "warn",
"vls.trace.server": "off",
"vls.methodCompletionMode": "nospace",
"editor.wordBasedSuggestions": false,
"editor.quickSuggestionsDelay": 500,
"editor.suggestOnTriggerCharacters": true,
"editor.hover.delay": 500
```

## Commands

* `VLS: Restart Server` -> restarts the server if it stops working for some reason

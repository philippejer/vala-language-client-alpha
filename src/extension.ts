import { commands, Disposable, ExtensionContext, OutputChannel, Selection, window, workspace } from 'vscode';
import { Executable, LanguageClient, LanguageClientOptions, RevealOutputChannelOn, ServerOptions, TransportKind } from 'vscode-languageclient';

export function activate(context: ExtensionContext) {
    // Custom command to move the cursor for CodeLens references since the protocol does not allow it (AFAIK)
    context.subscriptions.push(commands.registerCommand('vls.show.references', (lineStr: string, characterStr: string) => {
        const line = parseInt(lineStr, 10);
        const character = parseInt(characterStr, 10);
        if (isNaN(line) || isNaN(character)) {
            return;
        }

        // Change cursor position
        const editor = window.activeTextEditor;
        const position = editor.selection.active;
        var newPosition = position.with(line, character);
        var newSelection = new Selection(newPosition, newPosition);
        editor.selection = newSelection;

        // Trigger find all references command
        commands.executeCommand('editor.action.referenceSearch.trigger');
    }));

    let client = new ValaLanguageClient(context);
    context.subscriptions.push(client);
}

class ValaLanguageClient implements Disposable {

    outputChannel: OutputChannel;
    client: LanguageClient;
    instance: Disposable = null;

    constructor(context: ExtensionContext) {
        this.outputChannel = window.createOutputChannel('Vala Language Server');
        this.createClient();
        workspace.onDidChangeConfiguration(() => {
            let serverConfig = this.getServerConfig();
            this.client.sendNotification('workspace/didChangeConfiguration', serverConfig);
        });
        context.subscriptions.push(commands.registerCommand('vls.restart.server', () => this.restart()));
    }

    stop(): Thenable<void> {
        return this.client.stop().then(() => {
            if (this.instance != null) {
                this.instance.dispose();
                this.instance = null;
            }
        });
    }

    restart(): Thenable<void> {
        return this.stop().then(() => {
            this.createClient();
        });
    }

    dispose(): Thenable<void> {
        return this.stop();
    }

    private createClient() {
        let config = workspace.getConfiguration('vls');
        let serverPath: string = config['path'] && config['path']['server'] || config['serverPath'] || 'vala-language-server';
        let logLevel: 'silly' | 'debug' | 'info' | 'warn' | 'off' = config['debug'] && config['debug']['server'] || config['logLevel'];
        let methodCompletionMode: string = config['methodCompletionMode'];

        if (logLevel === 'silly' || logLevel === 'debug' || logLevel === 'info') {
            this.outputChannel.show();
        }

        let serverConfig = this.getServerConfig();
        let clientOptions: LanguageClientOptions = {
            documentSelector: ['vala', 'genie'],
            outputChannel: this.outputChannel,
            revealOutputChannelOn: RevealOutputChannelOn.Info,
            initializationOptions: serverConfig
        };

        let serverOptions: ServerOptions & Executable = {
            command: serverPath,
            options: {
                env: {
                    ...process.env
                }
            },
            transport: TransportKind.stdio
        };

        serverOptions.options.env['VLS_DEBUG'] = logLevel;
        if (logLevel === 'silly' || logLevel === 'debug' || logLevel === 'info') {
            serverOptions.options.env['G_MESSAGES_DEBUG'] = 'all';
        }
        serverOptions.options.env['VLS_METHOD_COMPLETION_MODE'] = methodCompletionMode;

        // Enables the output the debug logs from the JSON-RPC library (for reference, redundant with the message output from the extension).
        // if (serverDebug === 'debug') {
        //     serverOptions.options.env['JSONRPC_DEBUG'] = 'true';
        // }

        this.client = new LanguageClient('vls', 'Vala Language Server', serverOptions, clientOptions);
        this.instance = this.client.start();
    }

    private getServerConfig()
    {
        let config = workspace.getConfiguration('vls');
        let logLevel: 'debug' | 'info' | 'warn' | 'off' = config['debug'] && config['debug']['server'] || config['logLevel'];
        let methodCompletionMode: string = config['methodCompletionMode'];
        let referencesCodeLensEnabled: boolean = config['referencesCodeLensEnabled'];
        return {
            logLevel,
            methodCompletionMode,
            referencesCodeLensEnabled
        };
    }
}

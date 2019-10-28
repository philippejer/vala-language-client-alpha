import { ExtensionContext, workspace, commands, window, Disposable, OutputChannel } from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    RevealOutputChannelOn,
    Executable,
} from 'vscode-languageclient';

export function activate(context: ExtensionContext) {
    let client = new ValaLanguageClient(context);
    context.subscriptions.push(client);
}

class ValaLanguageClient implements Disposable {

    client: LanguageClient;
    instance: Disposable = null;

    constructor(context: ExtensionContext) {
        let config = workspace.getConfiguration('vls');
        let serverPath: string = config['path']['server'] || 'vala-language-server';
        let serverDebug: string = config['debug']['server'];
        let methodCompletionMode: string = config['methodCompletionMode'];

        const outputChannel = window.createOutputChannel('Vala Language Server');
        if (serverDebug === 'debug' || serverDebug === 'info') {
            outputChannel.show();
        }

        let clientOptions: LanguageClientOptions = {
            documentSelector: ['vala', 'genie'],
            outputChannel,
            revealOutputChannelOn: RevealOutputChannelOn.Info,
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

        serverOptions.options.env['VLS_DEBUG'] = serverDebug;
        if (serverDebug === 'debug' || serverDebug === 'info') {
            serverOptions.options.env['G_MESSAGES_DEBUG'] = 'all';
        }
        serverOptions.options.env['VLS_METHOD_COMPLETION_MODE'] = methodCompletionMode;
        
        // Enables the output the debug logs from the JSON-RPC library (for reference, redundant with the message output from the extension).
        // if (serverDebug === 'debug') {
        //     serverOptions.options.env['JSONRPC_DEBUG'] = 'true';
        // }

        this.client = new LanguageClient('vls', 'Vala Language Server', serverOptions, clientOptions);
        this.start();

        context.subscriptions.push(commands.registerCommand('vls.restart.server', () => {
            this.restart().then(() => {
                if (serverDebug) {
                    outputChannel.show();
                }
            });
        }));
    }

    start() {
        this.instance = this.client.start();
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
            this.start();
        });
    }

    dispose(): Thenable<void> {
        return this.stop();
    }
}

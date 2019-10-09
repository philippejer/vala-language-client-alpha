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
        let serverDebug: boolean = config['debug']['server'];

        const outputChannel = window.createOutputChannel('Vala Language Server');
        if (serverDebug) {
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

        if (serverDebug) {
            serverOptions.options.env['VLS_DEBUG'] = 'true';
            serverOptions.options.env['G_MESSAGES_DEBUG'] = 'all';
            // serverOptions.options.env['JSONRPC_DEBUG'] = 'true';
        }

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

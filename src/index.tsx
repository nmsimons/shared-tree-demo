/* eslint-disable react/jsx-key */
import React from 'react';
import { Guid } from 'guid-typescript';
import { createRoot } from 'react-dom/client';
import { loadFluidData } from './infra/fluid';
import { notesContainerSchema } from './infra/containerSchema';
import { ReactApp } from './react/ux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { initializeDevtools } from '@fluidframework/devtools';
import { devtoolsLogger } from './infra/clientProps';
import { ITree, TreeView } from 'fluid-framework';
import { App, Group, Note, appTreeConfiguration } from './schema/app_schema';
import { sessionTreeConfiguration } from './schema/session_schema';
import { getNewContentPrompter } from './utils/gpt_helpers';

const populationString = '__POPULATE_GPT__';

async function insertTemplateFromPrompt(
    schemaRoot: typeof App,
    treeView: TreeView<App>,
    prompt: string,
    populator: Record<string, (parent: Record<string, unknown>) => unknown>,
    validator: (content: unknown) => void | boolean
) {
    const prompter = getNewContentPrompter();
    const gptContent = await prompter(prompt);
    if (gptContent !== undefined) {
        // Remove existing content to start fresh
        if (treeView.root.items.length > 0) {
            treeView.root.items.removeRange();
        }
        try {
            populate(gptContent, populator);
            if (validator(gptContent) !== false) {
                // TODO: Kludge
                const items = (gptContent as { items: (Group | Note)[] }).items;
                for (const item of items) {
                    treeView.root.items.insertAtStart(item);
                }
                return;
            }
        } catch {
            // Do nothing
        }
    }

    alert('GPT failed to generate valid initial content.');
}

function populate(
    content: unknown,
    populator: Record<string, (parent: Record<string, unknown>) => void>
): void {
    if (
        content === undefined ||
        content === null ||
        typeof content === 'boolean' ||
        typeof content === 'number' ||
        typeof content === 'string'
    ) {
        return;
    }

    if (Array.isArray(content)) {
        for (const c of content) {
            populate(c, populator);
        }
    } else {
        const contentRecord = content as Record<string, unknown>;
        const pendingKeys: string[] = [];
        for (const [key, value] of Object.entries(contentRecord)) {
            const child = contentRecord[key];
            if (value === populationString) {
                pendingKeys.push(key);
            } else {
                populate(child, populator);
            }
        }
        for (const key of pendingKeys) {
            contentRecord[key] = populator[key](contentRecord);
        }
    }
}

async function start() {
    // create the root element for React
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);
    const root = createRoot(app);

    // Get the root container id from the URL
    // If there is no container id, then the app will make
    // a new container.
    let containerId = location.hash.substring(1);

    // Initialize Fluid Container
    const { services, container } = await loadFluidData(
        containerId,
        notesContainerSchema
    );

    // Initialize the SharedTree DDSes
    const sessionTree = (container.initialObjects.sessionData as ITree).schematize(
        sessionTreeConfiguration
    );
    const appTree = (container.initialObjects.appData as ITree).schematize(
        appTreeConfiguration
    );

    // Initialize debugging tools
    initializeDevtools({
        logger: devtoolsLogger,
        initialContainers: [
            {
                container,
                containerKey: 'My Container',
            },
        ],
    });

    // Render the app - note we attach new containers after render so
    // the app renders instantly on create new flow. The app will be
    // interactive immediately.
    root.render(
        <DndProvider backend={HTML5Backend}>
            <ReactApp
                appTree={appTree}
                sessionTree={sessionTree}
                audience={services.audience}
                container={container}
                insertTemplate={(prompt) =>
                    insertTemplateFromPrompt(
                        App,
                        appTree,
                        prompt,
                        {
                            id: () => Guid.create().toString(),
                            created: () => new Date().getTime(),
                            lastChanged: () => new Date().getTime(),
                        },
                        (json) => {
                            return JSON.stringify(json).indexOf('A bad word') === -1;
                        }
                    )
                }
            />
        </DndProvider>
    );

    // If the app is in a `createNew` state - no containerId, and the container is detached, we attach the container.
    // This uploads the container to the service and connects to the collaboration session.
    if (containerId.length == 0) {
        containerId = await container.attach();

        // The newly attached container is given a unique ID that can be used to access the container in another session
        history.replaceState(undefined, '', '#' + containerId);
    }
}

start().catch((error) => console.error(error));

import { AzureContainerServices } from '@fluidframework/azure-client';
import { ContainerSchema, IFluidContainer } from 'fluid-framework';
import {
    FieldSchema,
    ISharedTree,
    InitializeAndSchematizeConfiguration,
    SharedTreeFactory,
    ISharedTreeView,
} from '@fluid-experimental/tree2';

import React from 'react';
import { App } from './schema';

import { Guid } from 'guid-typescript';
import { ConnectionState, FluidContainer } from 'fluid-framework';
import {
    OdspContainerServices,
    OdspCreateContainerConfig,
    OdspGetContainerConfig,
} from './odsp-client/interfaces';
import { OdspClient } from './odsp-client/OdspClient';
import { getOdspDriver } from './odsp-client';
import { generateTestUser } from './helpers';

import { getOdspConfig } from './msal/tokens';

export class MySharedTree {
    public static getFactory(): SharedTreeFactory {
        return new SharedTreeFactory();
    }
}

// Define the schema of our Container. This includes the DDSes/DataObjects
// that we want to create dynamically and any
// initial DataObjects we want created when the container is first created.
const containerSchema: ContainerSchema = {
    initialObjects: {
        tree: MySharedTree,
    },
};

/**
 * This function will create a container if no container ID is passed on the hash portion of the URL.
 * If a container ID is provided, it will load the container.
 *
 * @returns The loaded container and container services.
 */
export const loadFluidData = async <TRoot extends FieldSchema>(
    config: InitializeAndSchematizeConfiguration<TRoot>
): Promise<{
    data: SharedTree<App>;
    services: AzureContainerServices;
    container: IFluidContainer;
}> => {
    const { container, services } = await initializeContainer();

    const tree = container.initialObjects.tree as ISharedTree;
    const view = tree.schematize(config);

    const data = new SharedTree<App>(view, view.root as any);

    return { data, services, container };
};

const treeSym = Symbol();

// The useTree React hook makes building the user interface very
// intuitive as it allows the developer to use typed tree data to build the UI
// and it ensures that any changes trigger an update to the React app.
export function useTree<TRoot>(tree: SharedTree<TRoot>): TRoot {
    // This proof-of-concept implementation allocates a state variable this is modified
    // when the tree changes to trigger re-render.
    const [invalidations, setInvalidations] = React.useState(0);

    // Register for tree deltas when the component mounts
    React.useEffect(() => {
        // Returns the cleanup function to be invoked when the component unmounts.
        return tree[treeSym].events.on('afterBatch', () => {
            setInvalidations(invalidations + Math.random());
        });
    });

    return tree.root as unknown as TRoot;
}

export class SharedTree<T> {
    constructor(private readonly tree: ISharedTreeView, public readonly root: T) {}

    public get [treeSym]() {
        return this.tree;
    }
}

const documentId = Guid.create().toString();

const containerPath = (url: string) => {
    const itemIdPattern = /itemId=([^&]+)/; // regular expression to match the itemId parameter value
    let itemId;

    const match = url.match(itemIdPattern); // get the match object for the itemId parameter value
    if (match) {
        itemId = match[1]; // extract the itemId parameter value from the match object
        console.log(itemId); // output: "itemidQ"
    } else {
        console.log('itemId parameter not found in the URL');
        itemId = '';
    }
    return itemId;
};

export async function initializeContainer(): Promise<{
    container: FluidContainer;
    services: OdspContainerServices;
}> {    
    const odspConfig = await getOdspConfig();
    const odspDriver = await getOdspDriver(odspConfig);
    
    const getContainerId = (): { containerId: string; isNew: boolean } => {
        let isNew = false;        
        if (location.hash.length === 0) {
            isNew = true;
        }
        const hash = location.hash;
        const itemId = hash.charAt(0) === '#' ? hash.substring(1) : hash;
        const containerId = localStorage.getItem(itemId) as string;
        return { containerId, isNew };
    };

    const { containerId, isNew } = getContainerId();

    let container: FluidContainer;
    let services: OdspContainerServices;

    if (isNew) {

        const containerConfig: OdspCreateContainerConfig = {
            siteUrl: odspDriver.siteUrl,
            driveId: odspDriver.driveId,
            folderName: odspDriver.directory,
            fileName: documentId,
        };

        const { fluidContainer, containerServices } =
            await OdspClient.createContainer(containerConfig, containerSchema);
        container = fluidContainer;
        services = containerServices;

        const sharingLink = await containerServices.generateLink();
        const itemId = containerPath(sharingLink);
        localStorage.setItem(itemId, sharingLink);
        console.log('CONTAINER CREATED');
        location.hash = itemId;
    } else {
        const containerConfig: OdspGetContainerConfig = {
            fileUrl: containerId, //pass file url
        };

        const { fluidContainer, containerServices } = await OdspClient.getContainer(
            containerConfig,
            containerSchema
        );

        container = fluidContainer;
        services = containerServices;        
    }

    if (container.connectionState !== ConnectionState.Connected) {
        await new Promise<void>((resolve) => {
            container.once('connected', () => {
                resolve();
            });
        });
    }

    return { container, services };
}

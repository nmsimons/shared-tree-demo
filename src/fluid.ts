import {
    AzureClient,
    AzureContainerServices,
} from '@fluidframework/azure-client';
import { ContainerSchema, IFluidContainer } from 'fluid-framework';
import {
    ISharedTree,
    InitializeAndSchematizeConfiguration,
    SharedTreeFactory,
    ISharedTreeView,
    TreeFieldSchema,
} from '@fluid-experimental/tree2';

import React from 'react';
import { App } from './schema';
import { clientProps } from './clientProps';

export class MySharedTree {
    public static getFactory(): SharedTreeFactory {
        return new SharedTreeFactory();
    }
}

const client = new AzureClient(clientProps);

// Define the schema of our Container. This includes the DDSes/DataObjects
// that we want to create dynamically and any
// initial DataObjects we want created when the container is first created.
const containerSchema: ContainerSchema = {
    initialObjects: {
        tree: MySharedTree,
    },
};

async function initializeNewContainer<TRoot extends TreeFieldSchema>(
    container: IFluidContainer,
    config: InitializeAndSchematizeConfiguration<TRoot>
): Promise<void> {
    const fluidTree = container.initialObjects.tree as ISharedTree;
    fluidTree.schematize(config);
}

/**
 * This function will create a container if no container ID is passed on the hash portion of the URL.
 * If a container ID is provided, it will load the container.
 *
 * @returns The loaded container and container services.
 */
export const loadFluidData = async <TRoot extends TreeFieldSchema>(
    config: InitializeAndSchematizeConfiguration<TRoot>
): Promise<{
    data: SharedTree<App>;
    services: AzureContainerServices;
    container: IFluidContainer;
}> => {
    let container: IFluidContainer;
    let services: AzureContainerServices;
    let id: string;

    // Get or create the document depending if we are running through the create new flow
    const createNew = location.hash.length === 0;
    if (createNew) {
        // The client will create a new detached container using the schema
        // A detached container will enable the app to modify the container before attaching it to the client
        ({ container, services } = await client.createContainer(containerSchema));

        // Initialize our Fluid data -- set default values, establish relationships, etc.
        await initializeNewContainer(container, config);

        // If the app is in a `createNew` state, and the container is detached, we attach the container.
        // This uploads the container to the service and connects to the collaboration session.
        id = await container.attach();
        // The newly attached container is given a unique ID that can be used to access the container in another session
        location.hash = id;
    } else {
        id = location.hash.substring(1);
        // Use the unique container ID to fetch the container created earlier.  It will already be connected to the
        // collaboration session.
        ({ container, services } = await client.getContainer(id, containerSchema));
    }

    const tree = container.initialObjects.tree as ISharedTree;
    const view = tree.schematizeView(config);

    const data = new SharedTree<App>(view, view.root2(config.schema) as any);

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

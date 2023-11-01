import {
    AzureClient,
    AzureContainerServices,
} from '@fluidframework/azure-client';
import { ContainerSchema, IFluidContainer } from 'fluid-framework';
import {
    ISharedTree,
    InitializeAndSchematizeConfiguration,
    SharedTreeFactory,
    ISharedTreeView
} from '@fluid-experimental/tree2';

import { Notebook, notebookSchemaConfig } from './notebookschema';
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

/**
 * This function will create a container if no container ID is passed on the hash portion of the URL.
 * If a container ID is provided, it will load the container.
 *
 * @returns The loaded container and container services.
 */
export const loadNotebookData = async (): Promise<{
    data: NotebookSharedTree<Notebook>;
    services: AzureContainerServices;
    container: IFluidContainer;
}> => {
    let container: IFluidContainer;
    let services: AzureContainerServices;
    let id: string;

    // Get or create the document depending if we are running through the create new flow
    const createNew = (location.hash.length === 0);
    if (createNew) {
        // The client will create a new detached container using the schema
        // A detached container will enable the app to modify the container before attaching it to the client
        ({ container, services } = await client.createContainer(containerSchema));

        // Initialize our Fluid data -- set default values, establish relationships, etc.
        (container.initialObjects.tree as ISharedTree).schematize(notebookSchemaConfig);

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

    const view = (container.initialObjects.tree as ISharedTree).schematizeView(notebookSchemaConfig);
    const data = new NotebookSharedTree<Notebook>(view, view.root2(notebookSchemaConfig.schema) as any);

    return { data, services, container };
};

export class NotebookSharedTree<T> {
    constructor(private readonly tree: ISharedTreeView, public readonly root: T) {}
}
import { SharedTreeFactory } from '@fluid-experimental/tree2';
import { ContainerSchema } from 'fluid-framework';

// Define the schema of our Container. This includes the DDSes/DataObjects
// that we want to create dynamically and any
// initial DataObjects we want created when the container is first created.

export class MySharedTree {
    public static getFactory(): SharedTreeFactory {
        return new SharedTreeFactory();
    }
}

export const notesContainerSchema: ContainerSchema = {
    initialObjects: {
        appData: MySharedTree,
        sessionData: MySharedTree,
    },
};

export const binderContainerSchema: ContainerSchema = {
    initialObjects: {
        binderData: MySharedTree,
    },
};

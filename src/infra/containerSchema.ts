import { ContainerSchema } from 'fluid-framework';
import { MySharedTree } from './fluid';

// Define the schema of our Container. This includes the DDSes/DataObjects
// that we want to create dynamically and any
// initial DataObjects we want created when the container is first created.

export const notesContainerSchema: ContainerSchema = {
    initialObjects: {
        appData: MySharedTree,
        sessionData: MySharedTree,
    },
};

import {
    TreeConfiguration,
    SchemaFactory,
    NodeFromSchema
} from '@fluid-experimental/tree2';

// Schema is defined using a builder object that generates a schema that is passed into the
// SharedTree data structure when it is intialized. The following code
// defines a set of types that are used to
// build the schema and, in the case of user-defined types, can be exported
// as TypeScript types to make it easier to write the app in a type-safe manner.

// Include a UUID to guarantee that this schema will be uniquely identifiable
const sb = new SchemaFactory('fc1db2e8-0000-11ee-be56-0242ac120002');

export class Client extends sb.object('Client', {
    clientId: sb.string,
    selected: sb.list(sb.string),
}) {}

// Define a root type.
export class Session extends sb.object('Session', {
    clients: sb.list(Client),
}) {}

// Export the tree config appropriate for this schema
// This is passed into the SharedTree when it is initialized
export const sessionTreeConfiguration = new TreeConfiguration(
    Session,
    () => ({
        clients: [],
    })    
);

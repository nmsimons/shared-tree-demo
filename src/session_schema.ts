import {
    AllowedUpdateType,
    InitializeAndSchematizeConfiguration,
    ProxyNode,
    SchemaBuilder,
} from '@fluid-experimental/tree2';

// Schema is defined using a builder object that generates a schema that is passed into the
// SharedTree data structure when it is intialized. The following code
// defines a set of types that are used to
// build the schema and, in the case of user-defined types, can be exported
// as TypeScript types to make it easier to write the app in a type-safe manner.

// Include a UUID to guarantee that this schema will be uniquely identifiable
const sb = new SchemaBuilder({ scope: 'fc1db2e8-0000-11ee-be56-0242ac120002' });

export const ClientSchema = sb.object('state', {
    clientId: sb.string,
    selected: sb.list(sb.string),
})

// Define a root type.
export const SessionSchema = sb.object('session', {
    clients: sb.list(ClientSchema),
});

// Export the types defined here as TypeScript types.
export type Client = ProxyNode<typeof ClientSchema>;
export type Session = ProxyNode<typeof SessionSchema>;

// Export the tree config appropriate for this schema
// This is passed into the SharedTree when it is initialized
export const sessionSchemaConfig: InitializeAndSchematizeConfiguration = {
    schema: sb.intoSchema(SessionSchema),
    initialTree: {
        clients: [],
    },
    allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
};

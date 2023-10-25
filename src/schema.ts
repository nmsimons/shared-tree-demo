import {
    AllowedUpdateType,
    InitializeAndSchematizeConfiguration,
    ProxyNode,
    SchemaBuilder,    
} from '@fluid-experimental/tree2';
import { Guid } from 'guid-typescript';

// Schema is defined using a builder object that generates a schema that is passed into the
// SharedTree data structure when it is intialized. The following code
// defines a set of types, both primitives and user-defined, that are used to
// build the schema and, in the case of user-defined types, can be exported
// as TypeScript types to make it easier to write the app in a type-safe manner.

// Include a UUID to guarantee that this schema will be unique
const sb = new SchemaBuilder({scope: 'fc1db2e8-0a00-11ee-be56-0242ac120002'});

// Define a simple user type - in most apps this would probably not be
// necessary as the user would be defined through an identity/auth service
export const UserSchema = sb.object('user', {
    name: sb.string,
    id: sb.string,
});

// Define the schema for the note object. This schema includes an id to make
// building the React app simpler, several fields that use primitive types, and a sequence
// of users (defined above) to track which users have voted on this note.
export const NoteSchema = sb.object('note', {
    id: sb.string,
    text: sb.string,
    author: UserSchema,
    votes: sb.list(UserSchema),
    created: sb.number,
    lastChanged: sb.number,
});

// Define the schema for the container of notes. This type includes a sequence of notes.
export const PileSchema = sb.object('pile', {
    id: sb.string,
    name: sb.string,
    notes: sb.list(NoteSchema),
});

// Define a root type. This only contains a sequence of piles but if the app needed
// additional metadata or other app data, it is easy to add that here.
export const AppSchema = sb.object('app', {
    piles: sb.list(PileSchema),
});

const schema = sb.intoSchema(AppSchema);

// Export the types defined here as TypeScript types.
export type App = ProxyNode<typeof AppSchema>;
export type Pile = ProxyNode<typeof PileSchema>;
export type Note = ProxyNode<typeof NoteSchema>;
export type User = ProxyNode<typeof UserSchema>;

export const schemaConfig: InitializeAndSchematizeConfiguration = {
    schema,
    initialTree: {
        piles: [
            {
                id: Guid.create().toString(),
                name: 'Ideas...',
                notes: [],
            },
        ],
    },
    allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
}
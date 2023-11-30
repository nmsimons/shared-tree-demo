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
const sb = new SchemaFactory('fc1db2e8-0a00-11ee-be56-0242ac120002');

// Define the schema for the note object. This schema includes an id to make
// building the React app simpler, several fields that use primitive types, and a sequence
// of user ids to track which users have voted on this note.
export class Note extends sb.object('Note', {
    id: sb.string,
    text: sb.string,
    author: sb.string,
    votes: sb.list(sb.string),
    created: sb.number,
    lastChanged: sb.number,        
}) {}

// Schema for a list of Notes. This could be defined inline
// but it is convenient to define it as its own schema
// so that it can be used as a type in other parts of the app
export const Notes = sb.list(Note);

// Define the schema for the container of notes. This type includes a sequence of notes.
export class Group extends sb.object('Group', {
    id: sb.string,
    name: sb.string,
    notes: Notes,
}) {}

// Schema for a list of Notes and Groups. This could be defined inline
// but it is convenient to define it as its own schema
// so that it can be used as a type in other parts of the app
export const Items = sb.list([Group, Note]);

// Define a root type.
export class App extends sb.object('App', {
    items: Items,
}) {}

// Export the types defined here as TypeScript types.
export type Notes = NodeFromSchema<typeof Notes>;
export type Items = NodeFromSchema<typeof Items>;

// Export the tree config appropriate for this schema
// This is passed into the SharedTree when it is initialized
export const appTreeConfiguration = new TreeConfiguration(
    App,
    () => ({
        items: [],
    })    
);

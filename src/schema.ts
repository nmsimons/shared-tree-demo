import {
    AllowedUpdateType,
    SchemaAware,
    SchemaBuilder,
    ValueSchema,
} from '@fluid-experimental/tree2';

// Schema is defined using a builder object that generates a schema that is passed into the
// SharedTree data structure when it is intialized. The following code
// defines a set of types, both primitives and user-defined, that are used to
// build the schema and, in the case of user-defined types, can be exported
// as TypeScript types to make it easier to write the app in a type-safe manner.

// Include a UUID to guarantee that this schema will be unique
const builder = new SchemaBuilder('fc1db2e8-0a00-11ee-be56-0242ac120002');

// Define the primitive this app uses
export const float64 = builder.leaf('number', ValueSchema.Number);
export const string = builder.leaf('string', ValueSchema.String);

// Define a simple user type - in most apps this would probably not be
// necessary as the user would be defined through an identity/auth service
export const userSchema = builder.struct('demo:user', {
    name: SchemaBuilder.fieldValue(string),
    id: SchemaBuilder.fieldValue(string),
});

// Define the schema for the note object. This schema includes an id to make
// building the React app simpler, several fields that use primitive types, and a sequence
// of users (defined above) to track which users have voted on this note.
export const noteSchema = builder.struct('demo:note', {
    id: SchemaBuilder.fieldValue(string),
    text: SchemaBuilder.fieldValue(string),
    author: SchemaBuilder.fieldValue(userSchema),
    votes: SchemaBuilder.fieldSequence(userSchema),
    created: SchemaBuilder.fieldValue(float64),
    lastChanged: SchemaBuilder.fieldValue(float64),
});

// Define the schema for the container of notes. This type includes a sequence of notes.
export const pileSchema = builder.struct('demo:pile', {
    id: SchemaBuilder.fieldValue(string),
    name: SchemaBuilder.fieldValue(string),
    notes: SchemaBuilder.fieldSequence(noteSchema),
});

// Define a root type. This only contains a sequence of piles but if the app needed
// additional metadata or other app data, it is easy to add that here.
export const appSchema = builder.struct('demo:app', {
    piles: SchemaBuilder.fieldSequence(pileSchema),
});

// Define the root of the schema as the app type.
export const rootField = SchemaBuilder.fieldValue(appSchema);

// Create the schema object to pass into the SharedTree
export const schema = builder.intoDocumentSchema(rootField);

// Export the types defined here as TypeScript types.
export type App = SchemaAware.TypedNode<typeof appSchema>;
export type Pile = SchemaAware.TypedNode<typeof pileSchema>;
export type Note = SchemaAware.TypedNode<typeof noteSchema>;
export type User = SchemaAware.TypedNode<typeof userSchema>;

export const schemaConfig = {
    schema,
    initialTree: {
        piles: [
            {
                id: '7301d9fc-f7ff-11ed-b67e-0242ac120002',
                name: 'Ideas...',
                notes: [],
            },
        ],
    },
    allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
}
import {
    FieldKinds,
    SchemaAware,
    SchemaBuilder,
    ValueSchema,
} from '@fluid-experimental/tree2';

const builder = new SchemaBuilder('Demo App');

export const float64 = builder.primitive('number', ValueSchema.Number);
export const string = builder.primitive('string', ValueSchema.String);
export const boolean = builder.primitive('boolean', ValueSchema.Boolean);

export const userSchema = builder.object('demo:user', {
    local: {
        name: SchemaBuilder.field(FieldKinds.value, string),
        id: SchemaBuilder.field(FieldKinds.value, string),
    },
});

export const noteSchema = builder.object('demo:note', {
    local: {
        id: SchemaBuilder.field(FieldKinds.value, string),
        text: SchemaBuilder.field(FieldKinds.value, string),
        author: SchemaBuilder.field(FieldKinds.value, userSchema),
        votes: SchemaBuilder.field(FieldKinds.sequence, userSchema),
        created: SchemaBuilder.field(FieldKinds.value, float64),
        lastChanged: SchemaBuilder.field(FieldKinds.value, float64)        
    },
});

export const pileSchema = builder.object('demo:pile', {
    local: {
        id: SchemaBuilder.field(FieldKinds.value, string),
        name: SchemaBuilder.field(FieldKinds.value, string),
        notes: SchemaBuilder.field(FieldKinds.sequence, noteSchema),
    },
});

export const appSchema = builder.object('demo:app', {
    local: {
        piles: SchemaBuilder.field(FieldKinds.sequence, pileSchema),
    },
});

export const rootField = SchemaBuilder.field(FieldKinds.value, appSchema);
export const schema = builder.intoDocumentSchema(rootField);

export type App = SchemaAware.TypedNode<typeof appSchema>;
export type Pile = SchemaAware.TypedNode<typeof pileSchema>;
export type Note = SchemaAware.TypedNode<typeof noteSchema>;
export type User = SchemaAware.TypedNode<typeof userSchema>;

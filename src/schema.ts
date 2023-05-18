import { FieldKinds, SchemaAware, SchemaBuilder, ValueSchema } from "@fluid-experimental/tree2";

const builder = new SchemaBuilder("felt app");

const boolean = builder.primitive("boolean", ValueSchema.Boolean);

const appSchema = builder.object("demo:app", {
	local: {
		works: SchemaBuilder.field(FieldKinds.value, boolean),
	}
})

export const rootField = SchemaBuilder.field(FieldKinds.value, appSchema);
export const schema = builder.intoDocumentSchema(rootField);

export type App = SchemaAware.TypedNode<typeof appSchema>;

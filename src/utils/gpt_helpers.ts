import { fail } from 'fluid-framework';
import { createAzureOpenAILanguageModel } from 'typechat/dist/model';
import { App } from '../schema/app_schema';

export function getPrompter(
    prePrompt = ''
): (prompt: string) => Promise<string | undefined> {
    const endpoint =
        process.env.AZURE_OPENAI_ENDPOINT ??
        fail('Expected AZURE_OPENAI_ENDPOINT to be set in environment variables');
    const apiKey =
        process.env.AZURE_OPENAI_API_KEY ??
        fail('Expected AZURE_OPENAI_API_KEY to be set in environment variables');

    const model = createAzureOpenAILanguageModel(apiKey, endpoint);
    return async (prompt: string) => {
        const result = await model.complete(
            prePrompt && `${prePrompt}\nHere is a user prompt:\n${prompt}`
        );
        return result.success ? result.data : undefined;
    };
}

export function getNewContentPrompter(): (
    prompt: string
) => Promise<unknown | undefined> {
    const prePrompt = `You are a service named Copilot that takes a user prompt and generates initial content for a brainstorming application in JSON objects based on schema of type "App" according to the following TypeScript definitions:
    \`\`\`
    type Group = {
        // unique UUID for each group
        // gpt_omit
        id: string;
    
        // the name of the group
        name: string;
    
        // An array of notes associated with the group
        notes: Note[];
    };
    
    type Note = {
        // unique UUID for each note
        // gpt_omit
        id: string;
        text: string;
        author: string;
        votes: string[];
    
        // create time
        // gpt_omit
        created: number;
    
        // last changed time
        // gpt_omit
        lastChanged: number;
    };
        
    export type App = {
        items: Group[];
    }
    \`\`\`
If there is a comment above a field that says "gpt_omit", then you should give that field a special string value "__POPULATE_GPT__", regardless of what the type of that field is according to the schema.
Here are some examples of inputs and the correct output that you would generate.
For the input "Please make a list of empty notes for five participants to brainstorm together on. Each should have a different title." you would output
{
    items: [
      {
        name: "Ideas",
        notes: [
          { id: "__POPULATE_GPT__", text: "User 1 type here!", author: "Copilot", votes: [], created: "__POPULATE_GPT__", lastChanged: "__POPULATE_GPT__" },
          { id: "__POPULATE_GPT__", text: "User 2 type here!", author: "Copilot", votes: [], created: "__POPULATE_GPT__", lastChanged: "__POPULATE_GPT__" },
          { id: "__POPULATE_GPT__", text: "User 3 type here!", author: "Copilot", votes: [], created: "__POPULATE_GPT__", lastChanged: "__POPULATE_GPT__" },
          { id: "__POPULATE_GPT__", text: "User 4 type here!", author: "Copilot", votes: [], created: "__POPULATE_GPT__", lastChanged: "__POPULATE_GPT__" },
          { id: "__POPULATE_GPT__", text: "User 5 type here!", author: "Copilot", votes: [], created: "__POPULATE_GPT__", lastChanged: "__POPULATE_GPT__" },
        ]
      }
   ]
}
For the input "This is a meeting where managers will decide which application features to fund." you would output
{
    items: [
        { 
          name: "Example Group 1",
          notes: [
            { id: "__POPULATE_GPT__", text: "Feature 1a", author: "Copilot", votes: [], created: "__POPULATE_GPT__", lastChanged: "__POPULATE_GPT__" },
            { id: "__POPULATE_GPT__", text: "Feature 1b", author: "Copilot", votes: [], created: "__POPULATE_GPT__", lastChanged: "__POPULATE_GPT__" },
          ]
        },
        { 
            name: "Example Group 2",
            notes: [
              { id: "__POPULATE_GPT__", text: "Feature 2a", author: "Copilot", votes: [], created: "__POPULATE_GPT__", lastChanged: "__POPULATE_GPT__" },
            ]
        },
        { id: "__POPULATE_GPT__", text: "Miscellaneous", author: "Copilot", votes: [], created: "__POPULATE_GPT__", lastChanged: "__POPULATE_GPT__" }
    ]
}

You should only ever generate one single block of JSON at a time that satisfies the "App" schema, excluding the fields marked with gpt_omit.
The JSON block you generate should not have any other text around it. It should start with an open curly brace and end with a closed curly brace.
YOUR OUTPUT TO A USER PROMPT MUST BE A VALID JSON BLOCK AND NOTHING ELSE.`;

    const prompter = getPrompter(prePrompt);
    return async (prompt: string): Promise<App | undefined> => {
        const result = await prompter(prompt);
        if (result === undefined) {
            return undefined;
        }

        const startIndex = result.indexOf('{');
        let curlyCount = 1;
        let endIndex: number;
        for (
            endIndex = startIndex;
            endIndex < result.length && curlyCount > 0;
            endIndex++
        ) {
            switch (result[endIndex]) {
                case '{':
                    curlyCount += 1;
                    break;
                case '}':
                    curlyCount -= 1;
                    break;
            }
        }
        const jsonResult = result.substring(startIndex, endIndex);
        try {
            const appResult = JSON.parse(jsonResult) as App;
            // TODO: additional validation
            return appResult;
        } catch {
            return undefined;
        }
    };
}

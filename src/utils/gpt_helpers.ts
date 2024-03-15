import { TreeView, fail } from 'fluid-framework';
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
        const result = await model.complete(`${prePrompt}\n${prompt}`);
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
YOUR OUTPUT TO A USER PROMPT MUST BE A VALID JSON BLOCK AND NOTHING ELSE.\nHere is a user prompt:`;

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

export function getSummaryForBoard(): (treeView: TreeView<App>) => Promise<string> {
    return async (treeView: TreeView<App>): Promise<string> => {
        const replacer = (key: any, value: any) => {
            if (typeof value === 'object' && value !== null) {
                if (Symbol.iterator in value) {
                    // Convert iterables to arrays
                    return [...value];
                }
                return value;
            }
            // Return the value unchanged if not an object
            return value;
        };
        const items = JSON.stringify(treeView.root.items, replacer);
        const prePrompt = `You are a service named Copilot tasked with creating summaries from provided data. Given a JSON object representing items on the Microsoft whiteboard app(do not mention we are looking at a whiteboard, the user will know what it is), your goal is to distill this information into a succinct paragraph. The summary should highlight the keyinformation found in the data, making it accessible and valuable to the user. Focus on the essence of these items, presenting them in a way, without referring to the data structure or the context of a whiteboard. Output should be a simple, clear string that conveys the collective significance of the items described.
    
    Here is the data you need to summarize:
    
    \`\`\`json
    ${items}
    \`\`\`
    
    Your summary should offer a clear overview specifying the format or context in which they are presented."`;

        const prompter = getPrompter(prePrompt);
        console.log(prompt);
        const result = await prompter("");
        if (result === undefined) {
            return 'GPT failed to generate valid summary.';
        }
        return result;
    };
}

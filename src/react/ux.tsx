/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Fragment, useState } from 'react';
import { App } from '../schema/app_schema';
import { Session } from '../schema/session_schema';
import '../output.css';
import {
    IFluidContainer,
    IMember,
    IServiceAudience,
    TreeView,
} from 'fluid-framework';
import { undefinedUserId } from '../utils/utils';
import { Canvas } from './canvasux';
import { Dialog } from '@headlessui/react';

export function ReactApp(props: {
    appTree: TreeView<App>;
    sessionTree: TreeView<Session>;
    audience: IServiceAudience<IMember>;
    container: IFluidContainer;
    insertTemplate: (prompt: string) => Promise<void>;
    summarizeBoard: () => Promise<void>;
}): JSX.Element {
    const [currentUser, setCurrentUser] = useState(undefinedUserId);
    const [connectionState, setConnectionState] = useState('');
    const [saved, setSaved] = useState(false);
    const [fluidMembers, setFluidMembers] = useState<string[]>([]);
    const [isPromptOpen, setIsPromptOpen] = useState(false);

    return (
        <>
            <div
                id="main"
                className="flex flex-col bg-transparent h-screen w-full overflow-hidden overscroll-none"
            >
                <Header
                    saved={saved}
                    connectionState={connectionState}
                    fluidMembers={fluidMembers}
                    clientId={currentUser}
                />
                <div className="flex h-[calc(100vh-48px)] flex-row ">
                    <Canvas
                        appTree={props.appTree}
                        sessionTree={props.sessionTree}
                        audience={props.audience}
                        container={props.container}
                        fluidMembers={fluidMembers}
                        currentUser={currentUser}
                        setCurrentUser={setCurrentUser}
                        setConnectionState={setConnectionState}
                        setSaved={setSaved}
                        setFluidMembers={setFluidMembers}
                        showPrompt={setIsPromptOpen}
                        summarizeBoard={props.summarizeBoard}
                    />
                </div>
            </div>
            <Prompt
                insertTemplate={props.insertTemplate}
                isOpen={isPromptOpen}
                setIsOpen={setIsPromptOpen}
            />
        </>
    );
}

export function Header(props: {
    saved: boolean;
    connectionState: string;
    fluidMembers: string[];
    clientId: string;
}): JSX.Element {
    return (
        <div className="h-[48px] flex shrink-0 flex-row items-center justify-between bg-black text-base text-white z-40 w-full">
            <div className="flex m-2">Brainstorm</div>
            <div className="flex m-2 ">
                {props.saved ? 'saved' : 'not saved'} | {props.connectionState} |
                users: {props.fluidMembers.length}
            </div>
        </div>
    );
}

export default function Prompt(props: {
    isOpen: boolean;
    setIsOpen: (arg: boolean) => void;
    insertTemplate: (prompt: string) => Promise<void>;
}): JSX.Element {
    const [templatePrompt, setTemplatePrompt] = useState(
        'Help me brainstorm new features to add to my digital Whiteboard application'
    );
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
    return (
        <Dialog
            className="absolute border-2 border-black bg-white p-4 w-1/2 top-1/4 left-1/4 z-50"
            open={props.isOpen}
            onClose={() => props.setIsOpen(false)}
        >
            <Dialog.Panel className="w-full text-left align-middle">
                <Dialog.Title className="font-bold text-lg">
                    Get things started...
                </Dialog.Title>
                <Dialog.Description>
                    {isLoadingTemplate
                        ? 'Generating template...'
                        : 'Populate your board with ideas based on this prompt.'}
                </Dialog.Description>
                <div className={isLoadingTemplate ? 'invisible' : ''}>
                    <textarea
                        rows={4}
                        className="resize-none border-2 border-black bg-white p-2 my-2 text-black w-full h-full"
                        value={templatePrompt}
                        id="insertTemplateInput"
                        aria-label="Describe the template to be inserted"
                        onChange={(e) => {
                            setTemplatePrompt(e.target.value);
                        }}
                    />
                    <div className="flex flex-row gap-4">
                        <button
                            className="bg-gray-500 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
                            id="insertTemplateButton"
                            onClick={() => {
                                setIsLoadingTemplate(true);
                                props
                                    .insertTemplate(templatePrompt)
                                    .then(() => setIsLoadingTemplate(false));
                            }}
                        >
                            Get me started
                        </button>
                        <button
                            className="bg-gray-500 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
                            onClick={() => props.setIsOpen(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Dialog.Panel>
        </Dialog>
    );
}

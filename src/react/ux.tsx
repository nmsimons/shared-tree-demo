/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { App } from '../schema/app_schema';
import { Session } from '../schema/session_schema';
import '../output.css';
import {
    IFluidContainer,
    IMember,
    IServiceAudience,
} from 'fluid-framework';
import { TreeView } from '@fluid-experimental/tree2';
import { undefinedUserId } from '../utils/utils';
import { Header, Canvas } from './canvasux';

export function ReactApp(props: {
    appTree: TreeView<App>;
    sessionTree: TreeView<Session>;
    audience: IServiceAudience<IMember>;
    container: IFluidContainer;
}): JSX.Element {
    const [currentUser, setCurrentUser] = useState(undefinedUserId);
    const [connectionState, setConnectionState] = useState('');
    const [saved, setSaved] = useState(false);
    const [fluidMembers, setFluidMembers] = useState<string[]>([]);
    
    return (
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
                />
            </div>
        </div>
    );
}

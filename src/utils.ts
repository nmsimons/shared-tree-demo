import { Note } from './app_schema';
import { Guid } from 'guid-typescript';
import { IInsecureUser } from '@fluidframework/test-runtime-utils';
import { Session, ClientSchema, Client } from './session_schema';

export function getRotation(note: Note) {
    const i = hashCode(note.id);

    const rotationArray = [
        'rotate-1',
        '-rotate-2',
        'rotate-2',
        '-rotate-1',
        '-rotate-3',
        'rotate-3',
    ];

    return rotationArray[i % rotationArray.length];
}

function hashCode(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = 31 * h + str.charCodeAt(i);
    }
    return h;
}

export const generateTestUser = (): IInsecureUser => {
    const user = {
        id: Guid.create().toString(),
        name: '[TEST USER]',
    };
    return user;
}

export enum dragType {
    NOTE = "Note",
    GROUP = "Group"
}

export enum selectAction {    
    MULTI,
    REMOVE,
    SINGLE
}

export const testNoteSelection = (
    item: Note,
    selection: Note[],
    setSelected: any,    
) => {
    if (selection.indexOf(item) == -1) {
        setSelected(false);
    } else {
        setSelected(true);
    }
    return;
}

export const updateNoteSelection = (
    item: Note,
    selection: Note[],
    setSelection: any,
    action: selectAction,
) => {
    // Since selection is going to change
    // create a new selection array
    const newNoteSelection: Note[] = [];

    // Persist existing selection since this is
    // a multi select or a remove
    if (action != selectAction.SINGLE) {
        newNoteSelection.push(...selection);
    }

    // Handle removed items and bail
    if (action == selectAction.REMOVE) {
        for (const obj of selection) {
            if (obj === item) {
                newNoteSelection.splice(newNoteSelection.indexOf(obj), 1);
            }
        }
        setSelection(newNoteSelection);
        return;
    }

    // Select the item and put it in the selection array
    newNoteSelection.push(item);
    setSelection(newNoteSelection);
}

export const testRemoteNoteSelection = (
    item: Note,
    session: Session,
    clientId: string,
    setRemoteSelected: any,
) => {
    for (const c of session.clients) {
        if (c.clientId != clientId) {            
            if (c.selected.indexOf(item.id) != -1){
                setRemoteSelected(true);
                return;               
            }
        }
    }
    setRemoteSelected(false);
}

export const updateRemoteNoteSelection = (
    item: Note,    
    action: selectAction,
    session: Session,
    clientId: string,    
) => {    

    // Handle removed items and bail
    if (action == selectAction.REMOVE) {
        for (const c of session.clients) {
            if (c.clientId === clientId) {
                const i = c.selected.indexOf(item.id);
                if (i != -1) c.selected.removeAt(i);
                return;                
            }
        }             
        return;
    }

    if (action == selectAction.MULTI) {
        for (const c of session.clients) {
            if (c.clientId === clientId) {
                const i = c.selected.indexOf(item.id);
                if (i == -1) c.selected.insertAtEnd([item.id]);
                return;
            }
        }
    }

    if (action == selectAction.SINGLE) {
        for (const c of session.clients) {
            if (c.clientId === clientId) {
                if (c.selected.length > 0) c.selected.removeRange(0);
                c.selected.insertAtStart([item.id]);
                return;                
            }
        }
    }

    const s = ClientSchema.create({
        clientId: clientId,
        selected: [item.id]
    })

    session.clients.insertAtEnd([s]);
}

export const cleanSessionData = (session: Session, audience: string[]) => {
    const deleteMe: Client[] = [];
    for (const c of session.clients) {
        if (!audience.includes(c.clientId)) deleteMe.push(c);
    }

    for (const c of deleteMe) {
        session.clients.removeAt(session.clients.indexOf(c) as number);
    }
};

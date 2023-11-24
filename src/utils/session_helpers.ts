import { Note } from '../schema/app_schema';
import { Session, client, Client } from '../schema/session_schema';
import { selectAction, undefinedUserId } from './utils';

export const updateLocalNoteSelection = (
    item: Note,
    selection: Note[],
    setSelection: (value: Note[]) => void,
    action: selectAction
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
};

export const testRemoteNoteSelection = (
    item: Note,
    session: Session,
    clientId: string,
    setRemoteSelected: (value: boolean) => void,
    setSelected: (value: boolean) => void,
    fluidMembers: string[]
) => {

    if (clientId == undefinedUserId) return;

    let selected = false;
    let remoteSelected = false;

    for (const c of session.clients) {
        if (c.clientId == clientId) {
            if (c.selected.indexOf(item.id) != -1) {
                selected = true;
            }
        }

        if (c.clientId != clientId && fluidMembers.indexOf(c.clientId) != -1) {
            if (c.selected.indexOf(item.id) != -1) {
                remoteSelected = true;
            }
        }
    }
    setRemoteSelected(remoteSelected);
    setSelected(selected);
};

export const updateRemoteNoteSelection = (
    item: Note,
    action: selectAction,
    session: Session,
    clientId: string,
    localSelection: Note[],
    setLocalSelection: (value: Note[]) => void
) => {

    if (clientId == undefinedUserId) return;

    // Update local state so that we have a local list of selected items we
    // can easily operate on (e.g., delete them)
    updateLocalNoteSelection(item, localSelection, setLocalSelection, action);

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
        console.log(clientId);
        for (const c of session.clients) {
            if (c.clientId === clientId) {
                if (c.selected.length > 0) c.selected.removeRange(0);
                c.selected.insertAtStart([item.id]);
                return;
            }
        }
    }

    const s = client.create({
        clientId: clientId,
        selected: [item.id],
    });

    session.clients.insertAtEnd([s]);
};

export const cleanSessionData = (session: Session, fluidMembers: string[]) => {
    const deleteMe: Client[] = [];
    for (const c of session.clients) {
        if (!fluidMembers.includes(c.clientId)) {
            deleteMe.push(c);
        }
    }

    for (const c of deleteMe) {
        session.clients.removeAt(session.clients.indexOf(c));
    }
};

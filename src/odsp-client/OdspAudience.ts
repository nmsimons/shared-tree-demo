/* eslint-disable @typescript-eslint/no-explicit-any */
/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServiceAudience } from '@fluidframework/fluid-static';
import { IClient } from '@fluidframework/protocol-definitions';
import { IOdspAudience, OdspMember } from './interfaces';

// eslint-disable-next-line padded-blocks
export class OdspAudience extends ServiceAudience implements IOdspAudience {
    protected createServiceMember(audienceMember: IClient): any {
        const azureUser = audienceMember.user as any;
        // assert(azureUser?.name !== undefined, 'Provided user was not an "AzureUser".');

        return {
            userId: audienceMember.user.id,
            userName: azureUser.name,
            connections: [],
            additionalDetails: azureUser.additionalDetails as unknown,
        };
    }

    /**
     * @inheritdoc
     */
    public getMembers(): Map<string, OdspMember> {
        const users = new Map<string, OdspMember>();
        // Iterate through the members and get the user specifics.
        this.audience.getMembers().forEach((member: IClient, clientId: string) => {
            // Get all the current human members
            if (member.details.capabilities.interactive) {
                const userId = member.user.id;
                // Ensure we're tracking the user
                let user: OdspMember | undefined = users.get(userId);
                if (user === undefined) {
                    user = {
                        userId,
                        userName: (member.user as any).name,
                        email: (member.user as any).email,
                        connections: [],
                    };
                    users.set(userId, user);
                }
                // Add this connection to their collection
                user.connections.push({ id: clientId, mode: member.mode });
            }
        });
        return users;
    }

    /**
     * @inheritdoc
     */
    public getMyself<OdspMember>(): OdspMember | undefined {
        return super.getMyself() as unknown as OdspMember;
    }
}

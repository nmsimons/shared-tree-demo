/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    PublicClientApplication,
    AuthenticationResult,
    InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { tokenMap } from '../odsp-client';

const msalConfig = {
    auth: {
        clientId: '19abc360-c059-48d8-854e-cfeef9a3c5b8',
        authority: 'https://login.microsoftonline.com/common/',
    },
};

const graphScopes = ['FileStorageContainer.Selected'];
const request = {scopes: ['FileStorageContainer.Selected']};

const sharePointScopes = [
    'https://M365x82694150.sharepoint.com/Container.Selected',
    'https://M365x82694150.sharepoint.com/AllSites.Write',
];

const pushScopes = [
    'offline_access',
    'https://pushchannel.1drv.ms/PushChannel.ReadWrite.All',
];

const msalInstance = new PublicClientApplication(msalConfig);

export async function getOdspConfig(): Promise<{
    graphToken: string;
    sharePointToken: string;
    pushToken: string;
    userName: string;
    siteUrl: string;
    directory: string
}> {
    const account = await msalInstance.getActiveAccount();

    const response = await msalInstance.acquireTokenSilent(request);
    
    const username = account?.username as string;
    const startIndex = username.indexOf('@') + 1;
    const endIndex = username.indexOf('.');
    const tenantName = username.substring(startIndex, endIndex);
    const siteUrl = `https://${tenantName}.sharepoint.com`;
    const directory = "shared-tree-demo";

    try {
        // Attempt to acquire SharePoint token silently
        const sharePointRequest = {
            scopes: sharePointScopes,
        };
        const sharePointTokenResult: AuthenticationResult =
            await msalInstance.acquireTokenSilent(sharePointRequest);

        // Attempt to acquire other token silently
        const otherRequest = {
            scopes: pushScopes,
        };
        const pushTokenResult: AuthenticationResult =
            await msalInstance.acquireTokenSilent(otherRequest);

        tokenMap.set('graphToken', response.accessToken);
        tokenMap.set('sharePointToken', sharePointTokenResult.accessToken);
        tokenMap.set('pushToken', pushTokenResult.accessToken);
        tokenMap.set('userName', username);
        tokenMap.set('siteUrl', siteUrl);

        // Return both tokens
        return {
            graphToken: response.accessToken,
            sharePointToken: sharePointTokenResult.accessToken,
            pushToken: pushTokenResult.accessToken,
            userName: response.account?.username as string,
            siteUrl: siteUrl,
            directory: directory
        };
    } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
            // If silent token acquisition fails, fall back to interactive flow
            const sharePointRequest = {
                scopes: sharePointScopes,
            };
            const sharePointTokenResult: AuthenticationResult =
                await msalInstance.acquireTokenPopup(sharePointRequest);

            const otherRequest = {
                scopes: pushScopes,
            };
            const pushTokenResult: AuthenticationResult =
                await msalInstance.acquireTokenPopup(otherRequest);

            tokenMap.set('graphToken', response.accessToken);
            tokenMap.set('sharePointToken', sharePointTokenResult.accessToken);
            tokenMap.set('pushToken', pushTokenResult.accessToken);
            tokenMap.set('userName', username);
            tokenMap.set('siteUrl', siteUrl);

            // Return both tokens
            return {
                graphToken: response.accessToken,
                sharePointToken: sharePointTokenResult.accessToken,
                pushToken: pushTokenResult.accessToken,
                userName: response.account?.username as string,
                siteUrl: siteUrl,
                directory: directory
            };
        } else {
            // Handle any other error
            console.error(error);
            throw error;
        }
    }
}

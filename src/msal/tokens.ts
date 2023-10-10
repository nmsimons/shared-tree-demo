/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    PublicClientApplication,
    AuthenticationResult,    
} from '@azure/msal-browser';

const msalConfig = {
    auth: {
        clientId: '19abc360-c059-48d8-854e-cfeef9a3c5b8',
        authority: 'https://login.microsoftonline.com/common/',
    },
};

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
    const response = await msalInstance.acquireTokenSilent(request);    
    const tenantName = response.tenantId;
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

        // Return all tokens
        return {
            graphToken: response.accessToken,
            sharePointToken: sharePointTokenResult.accessToken,
            pushToken: pushTokenResult.accessToken,
            userName: response.account?.username as string,
            siteUrl: siteUrl,
            directory: directory            
        };
    } catch (error) {        
        // Handle any other error
        console.error(error);
        throw error;        
    }
}

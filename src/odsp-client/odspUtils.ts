import { storeLocatorInOdspUrl } from '@fluidframework/odsp-driver';
import { Client as MSGraphClient } from '@microsoft/microsoft-graph-client';
import { IDriveInfo } from './interfaces';

/**
 * Generates a shareable URL to allow users within a scope to edit a given item in SharePoint.
 * @param msGraphClient Pre-authenticated client object to communicate with the Graph API.
 * @param itemId Unique ID for a resource.
 * @param fileAccessScope Scope of users that will have access to the ODSP fluid file.
 * @param driveInfo Optional parameter containing the site URL and drive ID if the file is not in the
 * current user's personal drive
 */
export async function getShareUrl(
    msGraphClient: MSGraphClient,
    itemId: string,
    fileAccessScope: string,
    driveInfo?: IDriveInfo
): Promise<string> {
    const apiPath: string = driveInfo
        ? `/drives/${driveInfo.driveId}/items/${itemId}/createLink`
        : `/me/drive/items/${itemId}/createLink`;
    return msGraphClient
        .api(apiPath)
        .post({
            type: 'edit',
            scope: fileAccessScope,
        })
        .then((rawMessages) => rawMessages.link.webUrl as string);
}

/**
 * Embeds Fluid data store locator data into given ODSP url and returns it.
 * @param shareUrl
 * @param itemId
 * @param driveInfo
 */
export function addLocatorToShareUrl(
    shareUrl: string,
    itemId: string,
    driveInfo: IDriveInfo
): string {
    const shareUrlObject = new URL(shareUrl);
    storeLocatorInOdspUrl(shareUrlObject, {
        siteUrl: driveInfo.siteUrl,
        driveId: driveInfo.driveId,
        itemId,
        dataStorePath: '',
    });
    return shareUrlObject.href;
}

/**
 * Given a Fluid file's metadata information such as its itemId and drive location, return a share link
 * that includes an encoded parameter that contains the necessary information required to locate the
 * file by the ODSP driver
 * @param itemId
 * @param driveInfo
 * @param msGraphClient
 * @param fileAccessScope
 * */
export async function getContainerShareLink(
    itemId: string,
    driveInfo: IDriveInfo,
    msGraphClient: MSGraphClient,
    fileAccessScope = 'organization'
): Promise<string> {
    const shareLink = await getShareUrl(
        msGraphClient,
        itemId,
        fileAccessScope,
        driveInfo
    );
    const shareLinkWithLocator = addLocatorToShareUrl(shareLink, itemId, driveInfo);

    return shareLinkWithLocator;
}

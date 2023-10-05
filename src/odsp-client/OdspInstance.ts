/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Loader } from '@fluidframework/container-loader';
import {
    IContainer,
    IFluidModuleWithDetails,
    IRuntimeFactory,
} from '@fluidframework/container-definitions';
import { IDocumentServiceFactory } from '@fluidframework/driver-definitions';
import {
    OdspDocumentServiceFactory,
    SharingLinkHeader,
    createOdspCreateContainerRequest,
} from '@fluidframework/odsp-driver';
import { IOdspResolvedUrl } from '@fluidframework/odsp-driver-definitions';
import { Client as MSGraphClient } from '@microsoft/microsoft-graph-client';
import {
    ContainerSchema,
    DOProviderContainerRuntimeFactory,
    FluidContainer,
} from '@fluidframework/fluid-static';
import {
    OdspCreateContainerConfig,
    OdspGetContainerConfig,
    OdspConnectionConfig,
    OdspResources,
    OdspContainerServices,
} from './interfaces';
import { getContainerShareLink } from './odspUtils';
import { OdspAudience } from './OdspAudience';
import { OdspUrlResolver } from './odspUrlResolver';
import { IClient } from '@fluidframework/protocol-definitions';

/**
 * OdspInstance provides the ability to have a Fluid object backed by the ODSP service
 */
export class OdspInstance {
    public readonly documentServiceFactory: IDocumentServiceFactory;
    public readonly urlResolver: OdspUrlResolver;

    constructor(
        private readonly serviceConnectionConfig: OdspConnectionConfig,
        server: string
    ) {
        this.documentServiceFactory = new OdspDocumentServiceFactory(
            serviceConnectionConfig.getSharePointToken,
            serviceConnectionConfig.getPushServiceToken,
            undefined
        );
        console.log('document service factory', this.documentServiceFactory);
        this.urlResolver = new OdspUrlResolver(server, {
            accessToken: serviceConnectionConfig.getMicrosoftGraphToken as string,
        });
    }

    public async createContainer(
        serviceContainerConfig: OdspCreateContainerConfig,
        containerSchema: ContainerSchema
    ): Promise<OdspResources> {
        const container = await this.getContainerInternal(
            serviceContainerConfig,
            new DOProviderContainerRuntimeFactory(containerSchema),
            true
        );

        return this.getContainerAndServices(container, serviceContainerConfig);
    }

    public async getContainer(
        serviceContainerConfig: OdspGetContainerConfig,
        containerSchema: ContainerSchema
    ): Promise<OdspResources> {
        console.log('load container');
        const container = await this.getContainerInternal(
            serviceContainerConfig,
            new DOProviderContainerRuntimeFactory(containerSchema),
            false
        );

        return this.getContainerAndServices(container, serviceContainerConfig);
    }

    private async getContainerAndServices(
        container: IContainer,
        containerConfig: OdspCreateContainerConfig | OdspGetContainerConfig
    ): Promise<OdspResources> {
        const rootDataObject = (await container.request({ url: '/' })).value;
        const fluidContainer = new FluidContainer(container, rootDataObject);
        const containerServices: OdspContainerServices = {
            generateLink: async () => {
                // If the file is meant to be shared, generate link will create and return a share link for the file
                // based on the audience provided in containerConfig
                if (containerConfig.sharedConfig) {
                    return this.generateShareLink(
                        container,
                        containerConfig.sharedConfig.sharedScope
                    );
                } else {
                    const url = await container.getAbsoluteUrl('/');
                    if (url === undefined) {
                        throw new Error('container has no url');
                    }
                    console.log('URL---', url);
                    return url;
                }
            },
            audience: new OdspAudience(container),
        };

        const odspContainerServices: OdspResources = {
            fluidContainer,
            containerServices,
        };

        return odspContainerServices;
    }

    private async generateShareLink(
        container: IContainer,
        fileAccessScope = 'organization'
    ) {
        if (this.serviceConnectionConfig.getGraphToken === undefined) {
            throw Error('Graph token required for generating share links');
        }
        const resolvedUrl = container.resolvedUrl as IOdspResolvedUrl;
        const msGraphClient: MSGraphClient = MSGraphClient.init({
            authProvider: async (done) => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const accessToken = await this.serviceConnectionConfig
                    .getGraphToken!({
                    siteUrl: resolvedUrl.siteUrl,
                    refresh: false,
                });
                if (typeof accessToken === 'string' || accessToken === null) {
                    return done(null, accessToken);
                } else {
                    return done(null, accessToken.token);
                }
            },
        });

        return getContainerShareLink(
            resolvedUrl.itemId,
            { driveId: resolvedUrl.driveId, siteUrl: resolvedUrl.siteUrl },
            msGraphClient,
            fileAccessScope
        );
    }

    private async getContainerInternal(
        containerConfig: OdspCreateContainerConfig | OdspGetContainerConfig,
        containerRuntimeFactory: IRuntimeFactory,
        createNew: boolean
    ): Promise<IContainer> {
        const load = async (): Promise<IFluidModuleWithDetails> => {
            return {
                module: { fluidExport: containerRuntimeFactory },
                details: { package: 'no-dynamic-package', config: {} },
            };
        };

        const codeLoader = { load };

        const client: IClient = {
            details: {
                capabilities: { interactive: true },
            },
            permission: [],
            scopes: [],
            user: { id: '' },
            mode: 'write',
        };

        const loader = new Loader({
            urlResolver: this.urlResolver,
            documentServiceFactory: this.documentServiceFactory,
            codeLoader,
            logger: containerConfig.logger,
            options: { client },
        });

        let container: IContainer;
        if (createNew) {
            // Generate an ODSP driver specific new file request using the provided metadata for the file from the
            // containerConfig.
            const { siteUrl, driveId, folderName, fileName } =
                containerConfig as OdspCreateContainerConfig;

            const request = createOdspCreateContainerRequest(
                siteUrl,
                driveId,
                folderName,
                fileName
            );
            // We're not actually using the code proposal (our code loader always loads the same module regardless of the
            // proposal), but the Container will only give us a NullRuntime if there's no proposal.  So we'll use a fake
            // proposal.
            container = (await loader.createDetachedContainer({
                package: '',
                config: {},
            })) as IContainer;
            await container.attach(request);
        } else {
            // Generate the request to fetch our existing container back using the provided SharePoint
            // file url. If this is a share URL, it needs to be redeemed by the service to be accessible
            // by other users. As such, we need to set the appropriate header for those scenarios.
            const { fileUrl, sharedConfig } =
                containerConfig as OdspGetContainerConfig;
            const request = {
                url: fileUrl,
                headers: sharedConfig
                    ? { [SharingLinkHeader.isSharingLinkToRedeem]: true }
                    : {},
            };
            // Request must be appropriate and parseable by resolver.
            container = await loader.resolve(request);
        }
        return container;
    }
}

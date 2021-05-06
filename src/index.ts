/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2021 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

import { Config } from './config';
import Server from './server';

if (require.main === module) {
    (async () => {
        // this module is main i.e. we were started as a server;
        // not used in unit test or "require" scenarios
        const svr = new Server(Config);

        // handle SIGTERM to exit gracefully
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received. Shutting down APIs...');

            await svr.stop();
            process.exit(0);
        });

        await svr.setupApi();

        svr.start().catch((err: any) => {
            console.log(err);
            process.exit(1);
        });
    })();
}

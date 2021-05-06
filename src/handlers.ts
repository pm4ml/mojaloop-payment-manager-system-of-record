/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2021 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

import { ApiContext, HandlerMap } from './types';
import { TransactionRecordModel } from './lib/models';

const healthCheck = async (ctx: ApiContext) => {
    ctx.body = JSON.stringify({ status: 'ok' });
};

const postTransactionRecords = async (ctx: ApiContext) => {
    const model = new TransactionRecordModel({});
    const result = await model.createTransactionRecord(
        { db: ctx.state.db },
        ctx.request.body
    );
    ctx.body = result;
};

const getTransactionRecordsByUniqueId = async (ctx: ApiContext) => {
    const model = new TransactionRecordModel({});
    const result = await model.getTransactionRecordsByUniqueId(
        { db: ctx.state.db },
        ctx.params.uniqueId
    );
    ctx.body = result;
};

const searchTransactionRecords = async (ctx: ApiContext) => {
    const model = new TransactionRecordModel({});
    const result = await model.searchTransactionRecords(
        { db: ctx.state.db },
        ctx.request.body,
    );
    ctx.body = result;
}

const Handlers: HandlerMap = {
    '/health': {
        get: healthCheck,
    },
    '/transactionRecords': {
        post: postTransactionRecords,
    },
    '/transactionRecords/{uniqueId}': {
        get: getTransactionRecordsByUniqueId,
    },
    '/transactionRecords/search': {
        post: searchTransactionRecords,
    }
};

export default Handlers;

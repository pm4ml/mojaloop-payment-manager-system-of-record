/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2021 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

import Database from '../database';
import { TransactionRecordQuery as dbtrc } from '../database';

/**
 * Facilitates dependency injection
 */
export interface TransactionRecordModelDependencies {
    database: Database;
}

/**
 * Transaction record model...err...transaction record model.
 */
export interface TransactionRecord {
    transactionRecordId?: number;
    uniqueId: string;
    insertTimestamp?: string;
    eventTimestamp: string;
    eventType: string;
    data: Record<string, any>;
}

/**
 * permitted operators within a data query expression
 */
export type dataQueryOperator = '=' | '>' | '<' | 'LIKE' | 'BETWEEN' | 'AND';

/**
 * Abstraction of a query "where" clause
 */
export interface dataQueryExpression {
    lhs: string | dataQueryExpression;
    operator: dataQueryOperator;
    rhs: string | dataQueryExpression;
}

/**
 * maybe look at a generic query language for the expression...
 * keep it simple for now and just use PG SQL (with jsonb)
 */
export interface TransactionRecordQuery {
    uniqueIdLike?: string;
    eventTypes?: Array<string>;
    eventTimestamp?: {
        from?: string;
        to?: string;
    }
    insertTimestamp?: {
        from?: string;
        to?: string;
    }
    dataQueryExpression?: dataQueryExpression;
}


/**
 * Transaction record abstraction
 */
export class TransactionRecordModel {
    _conf: any;

    constructor(conf: any) {
        this._conf = conf;
    }

    /**
     * Persists a transaction record
     *
     * @returns {Promise<TransactionRecord>}
     */
    async createTransactionRecord(
        deps: { db: Database },
        record: TransactionRecord
    ): Promise<TransactionRecord> {
        const eventTimestamp = new Date(record.eventTimestamp);
        const insertedId = await deps.db.insertTransactionRecord(
            record.uniqueId,
            eventTimestamp,
            record.eventType,
            record.data
        );
        record.transactionRecordId = insertedId;
        return record;
    }

    async getTransactionRecordsByUniqueId(
        deps: { db: Database },
        uniqueId: string
    ): Promise<Array<TransactionRecord>> {
        const records = await deps.db.getTransactionRecordsByUniqueId(uniqueId);
        return records.map(r => {
            return {
                ...r,
                eventTimestamp: r.eventTimestamp.toISOString(),
                insertTimestamp: r.insertTimestamp.toISOString(),
            };
        });
    }

    async searchTransactionRecords(
        deps: { db: Database },
        query: TransactionRecordQuery
    ): Promise<Array<TransactionRecord>> {
        // our external query representation uses ISO8601 timestamps, DB abstraction
        // needs js date objects
        const dbQuery: dbtrc = {
            uniqueIdLike: query.uniqueIdLike,
            eventTypes: query.eventTypes,
            eventTimestamp: {},
            insertTimestamp: {},
        };

        if(query.eventTimestamp) {
            dbQuery.eventTimestamp = {};

            if(query.eventTimestamp.from) {
                dbQuery.eventTimestamp.from = new Date(query.eventTimestamp.from);
            }
            if(query.eventTimestamp.to) {
                dbQuery.eventTimestamp.to = new Date(query.eventTimestamp.to);
            }
        }

        if(query.insertTimestamp) {
            dbQuery.insertTimestamp = {};

            if(query.insertTimestamp.from) {
                dbQuery.insertTimestamp.from = new Date(query.insertTimestamp.from);
            }
            if(query.insertTimestamp.to) {
                dbQuery.insertTimestamp.to = new Date(query.insertTimestamp.to);
            }
        }

        const records = await deps.db.searchTransactionRecords(dbQuery);
        return records.map(r => {
            return {
                ...r,
                eventTimestamp: r.eventTimestamp.toISOString(),
                insertTimestamp: r.insertTimestamp.toISOString(),
            };
        });        
    }
}

/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2021 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

import { Logger } from '@mojaloop/sdk-standard-components';
import { DatabaseConfig as dbconf } from '../../config';

export interface DatabaseDependencies {
    getClient: (conf: object) => object;
}

export interface DatabaseConfig {
    mysqlConfig: dbconf;
    logger: Logger.Logger;
}

export interface QueryResult {
    data?: Array<any>;
    insertId?: number;
}

/**
 * Exposes methods for interacting with persistent storage for application data
 *
 * Note that at some future point, should different backend DBMS types be required
 * this class could be swapped out for something else implementing the same interface
 */
export class MySqlDatabase {
    _conf: DatabaseConfig;
    _client: any;
    _logger: Logger.Logger;

    constructor(deps: DatabaseDependencies, conf: DatabaseConfig) {
        this._conf = conf;
        this._logger = conf.logger;

        this._client = deps.getClient(conf.mysqlConfig);
    }

    /**
     * Executes a simple query on the DBMS server to ensure connections are working
     *
     * @returns {Promise}
     */
    async testConnection() {
        return this._query('SELECT * FROM transactionRecord');
    }

    async _tableInsert(
        tableName: string,
        cols: Array<string>,
        vals: Array<any>
    ): Promise<QueryResult> {
        let session: any;
        try {
            session = await this._client.getSession();

            const table = session
                .getSchema(this._conf.mysqlConfig.schema)
                .getTable(tableName);
            const res = await table.insert(cols).values(vals).execute();
            const insertId = res.getAutoIncrementValue();

            session.close();
            return { insertId };
        } catch (e) {
            this._logger.push(e).error('Executing SQL query');
            if (session) session.close();
            throw e;
        }
    }

    async _tableQuery(
        tableName: string,
        cols: Array<string>,
        filter: string,
        vals: Array<Array<any>>
    ): Promise<QueryResult> {
        let session: any;
        try {
            session = await this._client.getSession();

            const table = session
                .getSchema(this._conf.mysqlConfig.schema)
                .getTable(tableName);
            let query = table.select(cols).where(filter);

            vals.forEach(v => {
                query = query.bind(...v);
            });

            const res = await query.execute();
            const ret = res.fetchAll();

            session.close();
            return { data: ret };
        } catch (e) {
            this._logger.push(e).error('Executing SQL query');
            if (session) session.close();
            throw e;
        }
    }

    /**
     * Uses the recommended mechanism for executing a SQL query against the connection pool
     *
     * @returns {Promise}
     */
    async _query(sql: string, values?: Array<any>): Promise<QueryResult> {
        let session: any;
        try {
            session = await this._client.getSession();
            let query = session.sql(sql);
            if (values && values.length) {
                query = query.bind(values);
            }

            const res = await query.execute();
            const data = res.fetchAll();
            //const insertId = result.getAutoIncrementValue();
            session.close();
            return { data };
        } catch (e) {
            this._logger.push(e).error('Executing SQL query');
            if (session) session.close();
            throw e;
        }
    }
}

/**
 * strong type for transaction record ID; the DBMS generated sequence
 * number of transaction data records
 */
export type TransactionRecordId = number;

/**
 * alias string to a strong type for safety.
 * maybe lock down to UUID in future.
 */
export type UniqueTransactionId = string;

/**
 * permitted operators within a data query expression
 */
export type dataQueryOperator = '=' | '>' | '<' | 'LIKE' | 'BETWEEN' | 'AND' | 'OR';

export interface dataQueryItem {
    filter: string;
    values: Array<any>;
}

/**
 * Abstraction of a query "where" clause
 */
export interface dataQueryExpression {
    lhs: dataQueryItem | dataQueryExpression;
    operator: dataQueryOperator;
    rhs: dataQueryItem | dataQueryExpression;
}

/**
 * maybe look at a generic query language for the expression...
 * keep it simple for now and just use PG SQL (with jsonb)
 */
export interface TransactionRecordQuery {
    uniqueIdLike?: string;
    eventTypes?: Array<string>;
    eventTimestamp?: {
        from?: Date;
        to?: Date;
    }
    insertTimestamp?: {
        from?: Date;
        to?: Date;
    }
    dataQueryExpression?: dataQueryExpression;
}

/**
 * data associated with a transaction record.
 * note that ID should/must be a DBMS sequential ID and therefore
 * can be relied upon for insertion sequence determination.
 * createdTimestamp should NOT be relied upon for sequence
 * order determination
 */
export interface TransactionRecord {
    transactionRecordId: TransactionRecordId;
    uniqueId: UniqueTransactionId;
    insertTimestamp: Date;
    eventTimestamp: Date;
    eventType: string;
    data: Record<string, any>;
}


/**
 * Utility function to torn a js Date object to a MySQL format timestamp string
 *
 * @returns {string}
 */
const dateToMySqlTimestamp = (date: Date): string => {
    const tsUtcYear = date.getUTCFullYear();
    const tsUtcMonth = date.getUTCMonth();
    const tsUtcDay = date.getUTCDay();
    const tsUtcHour = date.getUTCHours();
    const tsUtcMinute = date.getUTCMinutes();
    const tsUtcSecond = date.getUTCSeconds();
    const tsUtcMillisecond = date.getUTCMilliseconds();

    return (
        `${tsUtcYear}-${tsUtcMonth}-${tsUtcDay}` +
        ` ${tsUtcHour}:${tsUtcMinute}:${tsUtcSecond}.${tsUtcMillisecond}`
    );
};


/**
 * Turns a TransactionRecordQuery object into a filter string and
 * array of values
 *
 * @returns {object}
 */
const processQuery = (query: TransactionRecordQuery) => {
    let filter: string = '';
    let values: Array<any> = [];

    let and: boolean = false;

    if(query.uniqueIdLike) {
        filter += 'uniqueId LIKE :uid';
        values.push(['uid', `%${query.uniqueIdLike}%`]);
        and = true;
    }

    if(query.eventTypes && query.eventTypes.length) {
        if(and) {
            filter += ' AND ';
        }
        filter += `eventType IN (${query.eventTypes.map(t => (`"${t}"`)).join(',')})`;
        and = true;
    }

    if(query.eventTimestamp) {
        if(query.eventTimestamp.from) {
            if(and) {
                filter += ' AND ';
            }
            filter += 'eventTimestamp >= :etsf';
            values.push(['etsf', query.eventTimestamp.from.toISOString()])
            and = true;
        }
        if(query.eventTimestamp.to) {
            if(and) {
                filter += ' AND ';
            }
            filter += 'eventTimestamp <= :etst';
            values.push(['etst', query.eventTimestamp.to.toISOString()]);
            and = true;
        }
    }

    if(query.insertTimestamp) {
        if(query.insertTimestamp.from) {
            if(and) {
                filter += ' AND ';
            }
            filter += 'insertTimestamp >= :itsf';
            values.push(['itsf', query.insertTimestamp.from.toISOString()]);
            and = true;
        }
        if(query.insertTimestamp.to) {
            if(and) {
                filter += ' AND ';
            }
            filter += 'insertTimestamp <= :itst';
            values.push(['itst', query.insertTimestamp.to.toISOString()]);
            and = true;
        }
    }

    // process any data query expression that was supplied and add its filter and values
    // to our own
    if(query.dataQueryExpression) {
        const queryExpressionResult = processDataQueryExpression(query.dataQueryExpression);
        filter += ` AND (${queryExpressionResult.filter})`;
        values = values.concat(queryExpressionResult.values);
    }

    return { filter, values };
};


/**
 * Processes a data query expression and adds query syntax and values (for binding)
 * to express the query in MySQL form i.e. a string and values array
 * 
 * @returns {object}
 */
const processDataQueryExpression = (dataQueryExpression: dataQueryExpression) => {
    let filter: string = '';
    let values: Array<any> = [];

    if(typeof(dataQueryExpression.lhs) !== 'string') {
        const lhs = processDataQueryExpression(dataQueryExpression.lhs);
        filter += lhs.filter;
        values = values.concat(lhs.values); 
    }
    else {
        filter += '
    }
    

    return { filter, values };
};


/**
 * Subclass PostgresDatabase class to enable possible future use of
 * alternative DBMS that postgres without too much refactoring
 */
export default class Database extends MySqlDatabase {
    constructor(deps: DatabaseDependencies, conf: DatabaseConfig) {
        super(deps, conf);
    }

    /**
     * Creates a new transaction record with the supplied data.
     *
     * @returns {Promise}
     */
    async insertTransactionRecord(
        uniqueId: UniqueTransactionId,
        eventTimestamp: Date,
        eventType: string,
        transactionData: Record<string, any>
    ): Promise<TransactionRecordId> {
        const result = await this._tableInsert(
            'transactionRecord',
            ['uniqueId', 'eventTimestamp', 'eventType', 'data'],
            [
                uniqueId,
                dateToMySqlTimestamp(eventTimestamp),
                eventType,
                transactionData,
            ]
        );
        return Number(result.insertId);
    }

    /**
     * Returns all transaction data for the specified ID
     *
     * @returns {Promise}
     */
    async getTransactionRecordsByUniqueId(
        uniqueId: UniqueTransactionId
    ): Promise<TransactionRecord[]> {
        const result = await this._tableQuery(
            'transactionRecord',
            [
                'transactionRecordId',
                'uniqueId',
                'insertTimestamp',
                'eventTimestamp',
                'eventType',
                'data',
            ],
            'uniqueId = :id',
            [['id', uniqueId]]
        );

        if (!result.data) {
            return [];
        }

        this._logger.push(result.data).log('got data');

        return result.data.map((r: any) => ({
            transactionRecordId: r[0],
            uniqueId: r[1],
            insertTimestamp: new Date(r[2]),
            eventTimestamp: new Date(r[3]),
            eventType: r[4],
            data: r[5],
        }));
    }

    /**
     * Returns the latest transaction data for the specified ID
     *
     * @returns {Promise}
     */
    //    async getLatestTransactionRecordByUniqueId(
    //        uniqueId: UniqueTransactionId
    //    ): Promise<TransactionRecord> {
    //        const result = await this._query('SELECT TOP 1 FROM transactionrecord'
    //            + ' WHERE uniqueId = ? ORDER BY transactionRecordId DESC', [uniqueId]);
    //
    //        return result.data[0]
    //    }

    /**
     * Searches for specific transactions based on the supplied query
     *
     * @returns {Promise}
     */
    async searchTransactionRecords(
        query: TransactionRecordQuery
    ): Promise<TransactionRecord[]> {
        const { filter, values } = processQuery(query);

        this._logger.push({ filter, values }).log('Query processed');

        const result = await this._tableQuery(
            'transactionRecord',
            [
                'transactionRecordId',
                'uniqueId',
                'insertTimestamp',
                'eventTimestamp',
                'eventType',
                'data',
            ],
            filter,
            values,
        );

        if (!result.data) {
            return [];
        }

        this._logger.push(result.data).log('got data');

        return result.data.map((r: any) => ({
            transactionRecordId: r[0],
            uniqueId: r[1],
            insertTimestamp: new Date(r[2]),
            eventTimestamp: new Date(r[3]),
            eventType: r[4],
            data: r[5],
        }));
    }
}

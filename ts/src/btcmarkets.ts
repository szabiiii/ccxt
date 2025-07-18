
//  ---------------------------------------------------------------------------

import Exchange from './abstract/btcmarkets.js';
import { ArgumentsRequired, ExchangeError, OrderNotFound, InvalidOrder, InsufficientFunds, BadRequest } from './base/errors.js';
import { TICK_SIZE } from './base/functions/number.js';
import { Precise } from './base/Precise.js';
import { sha512 } from './static_dependencies/noble-hashes/sha512.js';
import type { Balances, Currency, Dict, Int, Market, Num, OHLCV, Order, OrderBook, OrderSide, OrderType, Str, Ticker, Trade, Transaction, int } from './base/types.js';

//  ---------------------------------------------------------------------------

/**
 * @class btcmarkets
 * @augments Exchange
 */
export default class btcmarkets extends Exchange {
    describe (): any {
        return this.deepExtend (super.describe (), {
            'id': 'btcmarkets',
            'name': 'BTC Markets',
            'countries': [ 'AU' ], // Australia
            'rateLimit': 1000, // market data cached for 1 second (trades cached for 2 seconds)
            'version': 'v3',
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': false,
                'swap': false,
                'future': false,
                'option': false,
                'addMargin': false,
                'borrowCrossMargin': false,
                'borrowIsolatedMargin': false,
                'borrowMargin': false,
                'cancelOrder': true,
                'cancelOrders': true,
                'closeAllPositions': false,
                'closePosition': false,
                'createDepositAddress': false,
                'createOrder': true,
                'createOrderWithTakeProfitAndStopLoss': false,
                'createOrderWithTakeProfitAndStopLossWs': false,
                'createPostOnlyOrder': false,
                'createReduceOnlyOrder': false,
                'createTriggerOrder': true,
                'fetchBalance': true,
                'fetchBorrowInterest': false,
                'fetchBorrowRate': false,
                'fetchBorrowRateHistories': false,
                'fetchBorrowRateHistory': false,
                'fetchBorrowRates': false,
                'fetchBorrowRatesPerSymbol': false,
                'fetchClosedOrders': 'emulated',
                'fetchCrossBorrowRate': false,
                'fetchCrossBorrowRates': false,
                'fetchDepositAddress': false,
                'fetchDepositAddresses': false,
                'fetchDepositAddressesByNetwork': false,
                'fetchDeposits': true,
                'fetchDepositsWithdrawals': true,
                'fetchFundingHistory': false,
                'fetchFundingInterval': false,
                'fetchFundingIntervals': false,
                'fetchFundingRate': false,
                'fetchFundingRateHistory': false,
                'fetchFundingRates': false,
                'fetchGreeks': false,
                'fetchIndexOHLCV': false,
                'fetchIsolatedBorrowRate': false,
                'fetchIsolatedBorrowRates': false,
                'fetchIsolatedPositions': false,
                'fetchLeverage': false,
                'fetchLeverages': false,
                'fetchLeverageTiers': false,
                'fetchLiquidations': false,
                'fetchLongShortRatio': false,
                'fetchLongShortRatioHistory': false,
                'fetchMarginAdjustmentHistory': false,
                'fetchMarginMode': false,
                'fetchMarginModes': false,
                'fetchMarketLeverageTiers': false,
                'fetchMarkets': true,
                'fetchMarkOHLCV': false,
                'fetchMarkPrices': false,
                'fetchMyLiquidations': false,
                'fetchMySettlementHistory': false,
                'fetchMyTrades': true,
                'fetchOHLCV': true,
                'fetchOpenInterest': false,
                'fetchOpenInterestHistory': false,
                'fetchOpenInterests': false,
                'fetchOpenOrders': true,
                'fetchOption': false,
                'fetchOptionChain': false,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchOrders': true,
                'fetchPosition': false,
                'fetchPositionHistory': false,
                'fetchPositionMode': false,
                'fetchPositions': false,
                'fetchPositionsForSymbol': false,
                'fetchPositionsHistory': false,
                'fetchPositionsRisk': false,
                'fetchPremiumIndexOHLCV': false,
                'fetchSettlementHistory': false,
                'fetchTicker': true,
                'fetchTime': true,
                'fetchTrades': true,
                'fetchTransactions': 'emulated',
                'fetchVolatilityHistory': false,
                'fetchWithdrawals': true,
                'reduceMargin': false,
                'repayCrossMargin': false,
                'repayIsolatedMargin': false,
                'repayMargin': false,
                'setLeverage': false,
                'setMargin': false,
                'setMarginMode': false,
                'setPositionMode': false,
                'withdraw': true,
            },
            'urls': {
                'logo': 'https://github.com/user-attachments/assets/8c8d6907-3873-4cc4-ad20-e22fba28247e',
                'api': {
                    'public': 'https://api.btcmarkets.net',
                    'private': 'https://api.btcmarkets.net',
                },
                'www': 'https://btcmarkets.net',
                'doc': [
                    'https://api.btcmarkets.net/doc/v3',
                    'https://github.com/BTCMarkets/API',
                ],
            },
            'api': {
                'public': {
                    'get': [
                        'markets',
                        'markets/{marketId}/ticker',
                        'markets/{marketId}/trades',
                        'markets/{marketId}/orderbook',
                        'markets/{marketId}/candles',
                        'markets/tickers',
                        'markets/orderbooks',
                        'time',
                    ],
                },
                'private': {
                    'get': [
                        'orders',
                        'orders/{id}',
                        'batchorders/{ids}',
                        'trades',
                        'trades/{id}',
                        'withdrawals',
                        'withdrawals/{id}',
                        'deposits',
                        'deposits/{id}',
                        'transfers',
                        'transfers/{id}',
                        'addresses',
                        'withdrawal-fees',
                        'assets',
                        'accounts/me/trading-fees',
                        'accounts/me/withdrawal-limits',
                        'accounts/me/balances',
                        'accounts/me/transactions',
                        'reports/{id}',
                    ],
                    'post': [
                        'orders',
                        'batchorders',
                        'withdrawals',
                        'reports',
                    ],
                    'delete': [
                        'orders',
                        'orders/{id}',
                        'batchorders/{ids}',
                    ],
                    'put': [
                        'orders/{id}',
                    ],
                },
            },
            'timeframes': {
                '1m': '1m',
                '1h': '1h',
                '1d': '1d',
            },
            'features': {
                'spot': {
                    'sandbox': false,
                    'createOrder': {
                        'marginMode': false,
                        'triggerPrice': true, // todo: check
                        'triggerPriceType': undefined,
                        'triggerDirection': false,
                        'stopLossPrice': false,
                        'takeProfitPrice': false,
                        'attachedStopLossTakeProfit': undefined,
                        'timeInForce': {
                            'IOC': true,
                            'FOK': true,
                            'PO': true,
                            'GTD': false,
                        },
                        'hedged': false,
                        'leverage': false,
                        'marketBuyRequiresPrice': false,
                        'marketBuyByCost': false,
                        'selfTradePrevention': true, // todo: check
                        'trailing': false,
                        'iceberg': false,
                    },
                    'createOrders': undefined,
                    'fetchMyTrades': {
                        'marginMode': false,
                        'limit': 100,
                        'daysBack': 100000,
                        'untilDays': 100000,
                        'symbolRequired': true,
                    },
                    'fetchOrder': {
                        'marginMode': false,
                        'trigger': false,
                        'trailing': false,
                        'symbolRequired': false,
                    },
                    'fetchOpenOrders': {
                        'marginMode': false,
                        'limit': 100,
                        'trigger': false,
                        'trailing': false,
                        'symbolRequired': false,
                    },
                    'fetchOrders': {
                        'marginMode': false,
                        'limit': 100,
                        'daysBack': 100000,
                        'untilDays': 100000,
                        'trigger': false,
                        'trailing': false,
                        'symbolRequired': false,
                    },
                    'fetchClosedOrders': {
                        'marginMode': false,
                        'limit': 100,
                        'daysBack': 100000,
                        'daysBackCanceled': 1,
                        'untilDays': 100000,
                        'trigger': false,
                        'trailing': false,
                        'symbolRequired': false,
                    },
                    'fetchOHLCV': {
                        'limit': 1000,
                    },
                },
                'swap': {
                    'linear': undefined,
                    'inverse': undefined,
                },
                'future': {
                    'linear': undefined,
                    'inverse': undefined,
                },
            },
            'precisionMode': TICK_SIZE,
            'exceptions': {
                'exact': {
                    'InsufficientFund': InsufficientFunds,
                    'InvalidPrice': InvalidOrder,
                    'InvalidAmount': InvalidOrder,
                    'MissingArgument': BadRequest,
                    'OrderAlreadyCancelled': InvalidOrder,
                    'OrderNotFound': OrderNotFound,
                    'OrderStatusIsFinal': InvalidOrder,
                    'InvalidPaginationParameter': BadRequest,
                },
                'broad': {
                },
            },
            'fees': {
                'percentage': true,
                'tierBased': true,
                'maker': this.parseNumber ('-0.0005'),
                'taker': this.parseNumber ('0.0020'),
            },
            'options': {
                'fees': {
                    'AUD': {
                        'maker': this.parseNumber ('0.0085'),
                        'taker': this.parseNumber ('0.0085'),
                    },
                },
            },
        });
    }

    async fetchTransactionsWithMethod (method, code: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        await this.loadMarkets ();
        const request: Dict = {};
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        if (since !== undefined) {
            request['after'] = since;
        }
        let currency = undefined;
        if (code !== undefined) {
            currency = this.currency (code);
        }
        const response = await this[method] (this.extend (request, params));
        return this.parseTransactions (response, currency, since, limit);
    }

    /**
     * @method
     * @name btcmarkets#fetchDepositsWithdrawals
     * @description fetch history of deposits and withdrawals
     * @see https://docs.btcmarkets.net/v3/#tag/Fund-Management-APIs/paths/~1v3~1transfers/get
     * @param {string} [code] unified currency code for the currency of the deposit/withdrawals, default is undefined
     * @param {int} [since] timestamp in ms of the earliest deposit/withdrawal, default is undefined
     * @param {int} [limit] max number of deposit/withdrawals to return, default is undefined
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a list of [transaction structure]{@link https://docs.ccxt.com/#/?id=transaction-structure}
     */
    async fetchDepositsWithdrawals (code: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Transaction[]> {
        return await this.fetchTransactionsWithMethod ('privateGetTransfers', code, since, limit, params);
    }

    /**
     * @method
     * @name btcmarkets#fetchDeposits
     * @description fetch all deposits made to an account
     * @see https://docs.btcmarkets.net/v3/#tag/Fund-Management-APIs/paths/~1v3~1deposits/get
     * @param {string} code unified currency code
     * @param {int} [since] the earliest time in ms to fetch deposits for
     * @param {int} [limit] the maximum number of deposits structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [transaction structures]{@link https://docs.ccxt.com/#/?id=transaction-structure}
     */
    async fetchDeposits (code: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Transaction[]> {
        return await this.fetchTransactionsWithMethod ('privateGetDeposits', code, since, limit, params);
    }

    /**
     * @method
     * @name btcmarkets#fetchWithdrawals
     * @description fetch all withdrawals made from an account
     * @see https://docs.btcmarkets.net/v3/#tag/Fund-Management-APIs/paths/~1v3~1withdrawals/get
     * @param {string} code unified currency code
     * @param {int} [since] the earliest time in ms to fetch withdrawals for
     * @param {int} [limit] the maximum number of withdrawals structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} a list of [transaction structures]{@link https://docs.ccxt.com/#/?id=transaction-structure}
     */
    async fetchWithdrawals (code: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Transaction[]> {
        return await this.fetchTransactionsWithMethod ('privateGetWithdrawals', code, since, limit, params);
    }

    parseTransactionStatus (status: Str) {
        const statuses: Dict = {
            'Accepted': 'pending',
            'Pending Authorization': 'pending',
            'Complete': 'ok',
            'Cancelled': 'cancelled',
            'Failed': 'failed',
        };
        return this.safeString (statuses, status, status);
    }

    parseTransactionType (type) {
        const statuses: Dict = {
            'Withdraw': 'withdrawal',
            'Deposit': 'deposit',
        };
        return this.safeString (statuses, type, type);
    }

    parseTransaction (transaction: Dict, currency: Currency = undefined): Transaction {
        //
        //    {
        //         "id": "6500230339",
        //         "assetName": "XRP",
        //         "amount": "500",
        //         "type": "Deposit",
        //         "creationTime": "2020-07-27T07:52:08.640000Z",
        //         "status": "Complete",
        //         "description": "RIPPLE Deposit, XRP 500",
        //         "fee": "0",
        //         "lastUpdate": "2020-07-27T07:52:08.665000Z",
        //         "paymentDetail": {
        //             "txId": "lsjflsjdfljsd",
        //             "address": "kjasfkjsdf?dt=873874545"
        //         }
        //    }
        //
        //    {
        //         "id": "500985282",
        //         "assetName": "BTC",
        //         "amount": "0.42570126",
        //         "type": "Withdraw",
        //         "creationTime": "2017-07-29T12:49:03.931000Z",
        //         "status": "Complete",
        //         "description": "BTC withdraw from [nick-btcmarkets@snowmonkey.co.uk] to Address: 1B9DsnSYQ54VMqFHVJYdGoLMCYzFwrQzsj amount: 0.42570126 fee: 0.00000000",
        //         "fee": "0.0005",
        //         "lastUpdate": "2017-07-29T12:52:20.676000Z",
        //         "paymentDetail": {
        //             "txId": "fkjdsfjsfljsdfl",
        //             "address": "a;daddjas;djas"
        //         }
        //    }
        //
        //    {
        //         "id": "505102262",
        //         "assetName": "XRP",
        //         "amount": "979.836",
        //         "type": "Deposit",
        //         "creationTime": "2017-07-31T08:50:01.053000Z",
        //         "status": "Complete",
        //         "description": "Ripple Deposit, X 979.8360",
        //         "fee": "0",
        //         "lastUpdate": "2017-07-31T08:50:01.290000Z"
        //     }
        //
        const timestamp = this.parse8601 (this.safeString (transaction, 'creationTime'));
        const lastUpdate = this.parse8601 (this.safeString (transaction, 'lastUpdate'));
        let type = this.parseTransactionType (this.safeStringLower (transaction, 'type'));
        if (type === 'withdraw') {
            type = 'withdrawal';
        }
        const cryptoPaymentDetail = this.safeDict (transaction, 'paymentDetail', {});
        const txid = this.safeString (cryptoPaymentDetail, 'txId');
        let address = this.safeString (cryptoPaymentDetail, 'address');
        let tag = undefined;
        if (address !== undefined) {
            const addressParts = address.split ('?dt=');
            const numParts = addressParts.length;
            if (numParts > 1) {
                address = addressParts[0];
                tag = addressParts[1];
            }
        }
        const addressTo = address;
        const tagTo = tag;
        const addressFrom = undefined;
        const tagFrom = undefined;
        const fee = this.safeString (transaction, 'fee');
        const status = this.parseTransactionStatus (this.safeString (transaction, 'status'));
        const currencyId = this.safeString (transaction, 'assetName');
        const code = this.safeCurrencyCode (currencyId);
        let amount = this.safeString (transaction, 'amount');
        if (fee) {
            amount = Precise.stringSub (amount, fee);
        }
        return {
            'id': this.safeString (transaction, 'id'),
            'txid': txid,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'network': undefined,
            'address': address,
            'addressTo': addressTo,
            'addressFrom': addressFrom,
            'tag': tag,
            'tagTo': tagTo,
            'tagFrom': tagFrom,
            'type': type,
            'amount': this.parseNumber (amount),
            'currency': code,
            'status': status,
            'updated': lastUpdate,
            'comment': this.safeString (transaction, 'description'),
            'internal': undefined,
            'fee': {
                'currency': code,
                'cost': this.parseNumber (fee),
                'rate': undefined,
            },
            'info': transaction,
        } as Transaction;
    }

    /**
     * @method
     * @name btcmarkets#fetchMarkets
     * @description retrieves data on all markets for btcmarkets
     * @see https://docs.btcmarkets.net/v3/#tag/Market-Data-APIs/paths/~1v3~1markets/get
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object[]} an array of objects representing market data
     */
    async fetchMarkets (params = {}): Promise<Market[]> {
        const response = await this.publicGetMarkets (params);
        //
        //     [
        //         {
        //             "marketId":"COMP-AUD",
        //             "baseAssetName":"COMP",
        //             "quoteAssetName":"AUD",
        //             "minOrderAmount":"0.00006",
        //             "maxOrderAmount":"1000000",
        //             "amountDecimals":"8",
        //             "priceDecimals":"2",
        //             "status": "Online"
        //         }
        //     ]
        //
        return this.parseMarkets (response);
    }

    parseMarket (market: Dict): Market {
        const baseId = this.safeString (market, 'baseAssetName');
        const quoteId = this.safeString (market, 'quoteAssetName');
        const id = this.safeString (market, 'marketId');
        const base = this.safeCurrencyCode (baseId);
        const quote = this.safeCurrencyCode (quoteId);
        const symbol = base + '/' + quote;
        const fees = this.safeValue (this.safeDict (this.options, 'fees', {}), quote, this.fees);
        const pricePrecision = this.parseNumber (this.parsePrecision (this.safeString (market, 'priceDecimals')));
        const minAmount = this.safeNumber (market, 'minOrderAmount');
        const maxAmount = this.safeNumber (market, 'maxOrderAmount');
        const status = this.safeString (market, 'status');
        let minPrice = undefined;
        if (quote === 'AUD') {
            minPrice = pricePrecision;
        }
        return {
            'id': id,
            'symbol': symbol,
            'base': base,
            'quote': quote,
            'settle': undefined,
            'baseId': baseId,
            'quoteId': quoteId,
            'settleId': undefined,
            'type': 'spot',
            'spot': true,
            'margin': false,
            'swap': false,
            'future': false,
            'option': false,
            'active': (status === 'Online'),
            'contract': false,
            'linear': undefined,
            'inverse': undefined,
            'taker': fees['taker'],
            'maker': fees['maker'],
            'contractSize': undefined,
            'expiry': undefined,
            'expiryDatetime': undefined,
            'strike': undefined,
            'optionType': undefined,
            'precision': {
                'amount': this.parseNumber (this.parsePrecision (this.safeString (market, 'amountDecimals'))),
                'price': pricePrecision,
            },
            'limits': {
                'leverage': {
                    'min': undefined,
                    'max': undefined,
                },
                'amount': {
                    'min': minAmount,
                    'max': maxAmount,
                },
                'price': {
                    'min': minPrice,
                    'max': undefined,
                },
                'cost': {
                    'min': undefined,
                    'max': undefined,
                },
            },
            'created': undefined,
            'info': market,
        };
    }

    /**
     * @method
     * @name btcmarkets#fetchTime
     * @description fetches the current integer timestamp in milliseconds from the exchange server
     * @see https://docs.btcmarkets.net/v3/#tag/Misc-APIs/paths/~1v3~1time/get
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {int} the current integer timestamp in milliseconds from the exchange server
     */
    async fetchTime (params = {}): Promise<Int> {
        const response = await this.publicGetTime (params);
        //
        //     {
        //         "timestamp": "2019-09-01T18:34:27.045000Z"
        //     }
        //
        return this.parse8601 (this.safeString (response, 'timestamp'));
    }

    parseBalance (response): Balances {
        const result: Dict = { 'info': response };
        for (let i = 0; i < response.length; i++) {
            const balance = response[i];
            const currencyId = this.safeString (balance, 'assetName');
            const code = this.safeCurrencyCode (currencyId);
            const account = this.account ();
            account['used'] = this.safeString (balance, 'locked');
            account['total'] = this.safeString (balance, 'balance');
            result[code] = account;
        }
        return this.safeBalance (result);
    }

    /**
     * @method
     * @name btcmarkets#fetchBalance
     * @description query for balance and get the amount of funds available for trading or funds locked in orders
     * @see https://docs.btcmarkets.net/v3/#tag/Account-APIs/paths/~1v3~1accounts~1me~1balances/get
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [balance structure]{@link https://docs.ccxt.com/#/?id=balance-structure}
     */
    async fetchBalance (params = {}): Promise<Balances> {
        await this.loadMarkets ();
        const response = await this.privateGetAccountsMeBalances (params);
        return this.parseBalance (response);
    }

    parseOHLCV (ohlcv, market: Market = undefined): OHLCV {
        //
        //     [
        //         "2020-09-12T18:30:00.000000Z",
        //         "14409.45", // open
        //         "14409.45", // high
        //         "14403.91", // low
        //         "14403.91", // close
        //         "0.01571701" // volume
        //     ]
        //
        return [
            this.parse8601 (this.safeString (ohlcv, 0)),
            this.safeNumber (ohlcv, 1), // open
            this.safeNumber (ohlcv, 2), // high
            this.safeNumber (ohlcv, 3), // low
            this.safeNumber (ohlcv, 4), // close
            this.safeNumber (ohlcv, 5), // volume
        ];
    }

    /**
     * @method
     * @name btcmarkets#fetchOHLCV
     * @description fetches historical candlestick data containing the open, high, low, and close price, and the volume of a market
     * @see https://docs.btcmarkets.net/v3/#tag/Market-Data-APIs/paths/~1v3~1markets~1{marketId}~1candles/get
     * @param {string} symbol unified symbol of the market to fetch OHLCV data for
     * @param {string} timeframe the length of time each candle represents
     * @param {int} [since] timestamp in ms of the earliest candle to fetch
     * @param {int} [limit] the maximum amount of candles to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {int[][]} A list of candles ordered as timestamp, open, high, low, close, volume
     */
    async fetchOHLCV (symbol: string, timeframe = '1m', since: Int = undefined, limit: Int = undefined, params = {}): Promise<OHLCV[]> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'marketId': market['id'],
            'timeWindow': this.safeString (this.timeframes, timeframe, timeframe),
            // 'from': this.iso8601 (since),
            // 'to': this.iso8601 (this.milliseconds ()),
            // 'before': 1234567890123,
            // 'after': 1234567890123,
            // 'limit': limit, // default 10, max 200
        };
        if (since !== undefined) {
            request['from'] = this.iso8601 (since);
        }
        if (limit !== undefined) {
            request['limit'] = Math.min (limit, 200); // default is 10, max 200
        }
        const response = await this.publicGetMarketsMarketIdCandles (this.extend (request, params));
        //
        //     [
        //         ["2020-09-12T18:30:00.000000Z","14409.45","14409.45","14403.91","14403.91","0.01571701"],
        //         ["2020-09-12T18:21:00.000000Z","14409.45","14409.45","14409.45","14409.45","0.0035"],
        //         ["2020-09-12T18:03:00.000000Z","14361.37","14361.37","14361.37","14361.37","0.00345221"],
        //     ]
        //
        return this.parseOHLCVs (response, market, timeframe, since, limit);
    }

    /**
     * @method
     * @name btcmarkets#fetchOrderBook
     * @description fetches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
     * @see https://docs.btcmarkets.net/v3/#tag/Market-Data-APIs/paths/~1v3~1markets~1{marketId}~1orderbook/get
     * @param {string} symbol unified symbol of the market to fetch the order book for
     * @param {int} [limit] the maximum amount of order book entries to return
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} A dictionary of [order book structures]{@link https://docs.ccxt.com/#/?id=order-book-structure} indexed by market symbols
     */
    async fetchOrderBook (symbol: string, limit: Int = undefined, params = {}): Promise<OrderBook> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'marketId': market['id'],
        };
        const response = await this.publicGetMarketsMarketIdOrderbook (this.extend (request, params));
        //
        //     {
        //         "marketId":"BTC-AUD",
        //         "snapshotId":1599936148941000,
        //         "asks":[
        //             ["14459.45","0.00456475"],
        //             ["14463.56","2"],
        //             ["14470.91","0.98"],
        //         ],
        //         "bids":[
        //             ["14421.01","0.52"],
        //             ["14421","0.75"],
        //             ["14418","0.3521"],
        //         ]
        //     }
        //
        const timestamp = this.safeIntegerProduct (response, 'snapshotId', 0.001);
        const orderbook = this.parseOrderBook (response, symbol, timestamp);
        orderbook['nonce'] = this.safeInteger (response, 'snapshotId');
        return orderbook;
    }

    parseTicker (ticker: Dict, market: Market = undefined): Ticker {
        //
        // fetchTicker
        //
        //     {
        //         "marketId":"BAT-AUD",
        //         "bestBid":"0.3751",
        //         "bestAsk":"0.377",
        //         "lastPrice":"0.3769",
        //         "volume24h":"56192.97613335",
        //         "volumeQte24h":"21179.13270465",
        //         "price24h":"0.0119",
        //         "pricePct24h":"3.26",
        //         "low24h":"0.3611",
        //         "high24h":"0.3799",
        //         "timestamp":"2020-08-09T18:28:23.280000Z"
        //     }
        //
        const marketId = this.safeString (ticker, 'marketId');
        market = this.safeMarket (marketId, market, '-');
        const symbol = market['symbol'];
        const timestamp = this.parse8601 (this.safeString (ticker, 'timestamp'));
        const last = this.safeString (ticker, 'lastPrice');
        const baseVolume = this.safeString (ticker, 'volume24h');
        const quoteVolume = this.safeString (ticker, 'volumeQte24h');
        const change = this.safeString (ticker, 'price24h');
        const percentage = this.safeString (ticker, 'pricePct24h');
        return this.safeTicker ({
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': this.safeString (ticker, 'high24h'),
            'low': this.safeString (ticker, 'low'),
            'bid': this.safeString (ticker, 'bestBid'),
            'bidVolume': undefined,
            'ask': this.safeString (ticker, 'bestAsk'),
            'askVolume': undefined,
            'vwap': undefined,
            'open': undefined,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': change,
            'percentage': percentage,
            'average': undefined,
            'baseVolume': baseVolume,
            'quoteVolume': quoteVolume,
            'info': ticker,
        }, market);
    }

    /**
     * @method
     * @name btcmarkets#fetchTicker
     * @description fetches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
     * @see https://docs.btcmarkets.net/v3/#tag/Market-Data-APIs/paths/~1v3~1markets~1{marketId}~1ticker/get
     * @param {string} symbol unified symbol of the market to fetch the ticker for
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
     */
    async fetchTicker (symbol: string, params = {}): Promise<Ticker> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'marketId': market['id'],
        };
        const response = await this.publicGetMarketsMarketIdTicker (this.extend (request, params));
        //
        //     {
        //         "marketId":"BAT-AUD",
        //         "bestBid":"0.3751",
        //         "bestAsk":"0.377",
        //         "lastPrice":"0.3769",
        //         "volume24h":"56192.97613335",
        //         "volumeQte24h":"21179.13270465",
        //         "price24h":"0.0119",
        //         "pricePct24h":"3.26",
        //         "low24h":"0.3611",
        //         "high24h":"0.3799",
        //         "timestamp":"2020-08-09T18:28:23.280000Z"
        //     }
        //
        return this.parseTicker (response, market);
    }

    async fetchTicker2 (symbol: string, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'id': market['id'],
        };
        const response = await this.publicGetMarketsMarketIdTicker (this.extend (request, params));
        return this.parseTicker (response, market);
    }

    parseTrade (trade: Dict, market: Market = undefined): Trade {
        //
        // public fetchTrades
        //
        //     {
        //         "id":"6191646611",
        //         "price":"539.98",
        //         "amount":"0.5",
        //         "timestamp":"2020-08-09T15:21:05.016000Z",
        //         "side":"Ask"
        //     }
        //
        // private fetchMyTrades
        //
        //     {
        //         "id": "36014819",
        //         "marketId": "XRP-AUD",
        //         "timestamp": "2019-06-25T16:01:02.977000Z",
        //         "price": "0.67",
        //         "amount": "1.50533262",
        //         "side": "Ask",
        //         "fee": "0.00857285",
        //         "orderId": "3648306",
        //         "liquidityType": "Taker",
        //         "clientOrderId": "48"
        //     }
        //
        const timestamp = this.parse8601 (this.safeString (trade, 'timestamp'));
        const marketId = this.safeString (trade, 'marketId');
        market = this.safeMarket (marketId, market, '-');
        const feeCurrencyCode = (market['quote'] === 'AUD') ? market['quote'] : market['base'];
        let side = this.safeString (trade, 'side');
        if (side === 'Bid') {
            side = 'buy';
        } else if (side === 'Ask') {
            side = 'sell';
        }
        const id = this.safeString (trade, 'id');
        const priceString = this.safeString (trade, 'price');
        const amountString = this.safeString (trade, 'amount');
        const orderId = this.safeString (trade, 'orderId');
        let fee = undefined;
        const feeCostString = this.safeString (trade, 'fee');
        if (feeCostString !== undefined) {
            fee = {
                'cost': feeCostString,
                'currency': feeCurrencyCode,
            };
        }
        const takerOrMaker = this.safeStringLower (trade, 'liquidityType');
        return this.safeTrade ({
            'info': trade,
            'id': id,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'order': orderId,
            'symbol': market['symbol'],
            'type': undefined,
            'side': side,
            'price': priceString,
            'amount': amountString,
            'cost': undefined,
            'takerOrMaker': takerOrMaker,
            'fee': fee,
        }, market);
    }

    /**
     * @method
     * @name btcmarkets#fetchTrades
     * @description get the list of most recent trades for a particular symbol
     * @see https://docs.btcmarkets.net/v3/#tag/Market-Data-APIs/paths/~1v3~1markets~1{marketId}~1trades/get
     * @param {string} symbol unified symbol of the market to fetch trades for
     * @param {int} [since] timestamp in ms of the earliest trade to fetch
     * @param {int} [limit] the maximum amount of trades to fetch
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=public-trades}
     */
    async fetchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            // 'since': 59868345231,
            'marketId': market['id'],
        };
        const response = await this.publicGetMarketsMarketIdTrades (this.extend (request, params));
        //
        //     [
        //         {"id":"6191646611","price":"539.98","amount":"0.5","timestamp":"2020-08-09T15:21:05.016000Z","side":"Ask"},
        //         {"id":"6191646610","price":"539.99","amount":"0.5","timestamp":"2020-08-09T15:21:05.015000Z","side":"Ask"},
        //         {"id":"6191646590","price":"540","amount":"0.00233785","timestamp":"2020-08-09T15:21:04.171000Z","side":"Bid"},
        //     ]
        //
        return this.parseTrades (response, market, since, limit);
    }

    /**
     * @method
     * @name btcmarkets#createOrder
     * @description create a trade order
     * @see https://docs.btcmarkets.net/v3/#tag/Order-Placement-APIs/paths/~1v3~1orders/post
     * @param {string} symbol unified symbol of the market to create an order in
     * @param {string} type 'market' or 'limit'
     * @param {string} side 'buy' or 'sell'
     * @param {float} amount how much of currency you want to trade in units of base currency
     * @param {float} [price] the price at which the order is to be fulfilled, in units of the quote currency, ignored in market orders
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @param {float} [params.triggerPrice] the price at which a trigger order is triggered at
     * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    async createOrder (symbol: string, type: OrderType, side: OrderSide, amount: number, price: Num = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'marketId': market['id'],
            // 'price': this.priceToPrecision (symbol, price),
            'amount': this.amountToPrecision (symbol, amount),
            // 'type': 'Limit', // "Limit", "Market", "Stop Limit", "Stop", "Take Profit"
            'side': (side === 'buy') ? 'Bid' : 'Ask',
            // 'triggerPrice': this.priceToPrecision (symbol, triggerPrice), // required for Stop, Stop Limit, Take Profit orders
            // 'targetAmount': this.amountToPrecision (symbol, targetAmount), // target amount when a desired target outcome is required for order execution
            // 'timeInForce': 'GTC', // GTC, FOK, IOC
            // 'postOnly': false, // boolean if this is a post-only order
            // 'selfTrade': 'A', // A = allow, P = prevent
            // 'clientOrderId': this.uuid (),
        };
        const lowercaseType = type.toLowerCase ();
        const orderTypes = this.safeValue (this.options, 'orderTypes', {
            'limit': 'Limit',
            'market': 'Market',
            'stop': 'Stop',
            'stop limit': 'Stop Limit',
            'take profit': 'Take Profit',
        });
        request['type'] = this.safeString (orderTypes, lowercaseType, type);
        let priceIsRequired = false;
        let triggerPriceIsRequired = false;
        if (lowercaseType === 'limit') {
            priceIsRequired = true;
        // } else if (lowercaseType === 'market') {
        //     ...
        // }
        } else if (lowercaseType === 'stop limit') {
            triggerPriceIsRequired = true;
            priceIsRequired = true;
        } else if (lowercaseType === 'take profit') {
            triggerPriceIsRequired = true;
        } else if (lowercaseType === 'stop') {
            triggerPriceIsRequired = true;
        }
        if (priceIsRequired) {
            if (price === undefined) {
                throw new ArgumentsRequired (this.id + ' createOrder() requires a price argument for a ' + type + 'order');
            } else {
                request['price'] = this.priceToPrecision (symbol, price);
            }
        }
        if (triggerPriceIsRequired) {
            const triggerPrice = this.safeNumber (params, 'triggerPrice');
            params = this.omit (params, 'triggerPrice');
            if (triggerPrice === undefined) {
                throw new ArgumentsRequired (this.id + ' createOrder() requires a triggerPrice parameter for a ' + type + 'order');
            } else {
                request['triggerPrice'] = this.priceToPrecision (symbol, triggerPrice);
            }
        }
        const clientOrderId = this.safeString (params, 'clientOrderId');
        if (clientOrderId !== undefined) {
            request['clientOrderId'] = clientOrderId;
        }
        params = this.omit (params, 'clientOrderId');
        const response = await this.privatePostOrders (this.extend (request, params));
        //
        //     {
        //         "orderId": "7524",
        //         "marketId": "BTC-AUD",
        //         "side": "Bid",
        //         "type": "Limit",
        //         "creationTime": "2019-08-30T11:08:21.956000Z",
        //         "price": "100.12",
        //         "amount": "1.034",
        //         "openAmount": "1.034",
        //         "status": "Accepted",
        //         "clientOrderId": "1234-5678",
        //         "timeInForce": "IOC",
        //         "postOnly": false,
        //         "selfTrade": "P",
        //         "triggerAmount": "105",
        //         "targetAmount": "1000"
        //     }
        //
        return this.parseOrder (response, market);
    }

    /**
     * @method
     * @name btcmarkets#cancelOrders
     * @description cancel multiple orders
     * @see https://docs.btcmarkets.net/v3/#tag/Batch-Order-APIs/paths/~1v3~1batchorders~1{ids}/delete
     * @param {string[]} ids order ids
     * @param {string} symbol not used by btcmarkets cancelOrders ()
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} an list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    async cancelOrders (ids, symbol: Str = undefined, params = {}) {
        await this.loadMarkets ();
        for (let i = 0; i < ids.length; i++) {
            ids[i] = parseInt (ids[i]);
        }
        const request: Dict = {
            'ids': ids,
        };
        const response = await this.privateDeleteBatchordersIds (this.extend (request, params));
        //
        //    {
        //       "cancelOrders": [
        //            {
        //               "orderId": "414186",
        //               "clientOrderId": "6"
        //            },
        //            ...
        //        ],
        //        "unprocessedRequests": [
        //            {
        //               "code": "OrderAlreadyCancelled",
        //               "message": "order is already cancelled.",
        //               "requestId": "1"
        //            }
        //        ]
        //    }
        //
        const cancelOrders = this.safeList (response, 'cancelOrders', []);
        const unprocessedRequests = this.safeList (response, 'unprocessedRequests', []);
        const orders = this.arrayConcat (cancelOrders, unprocessedRequests);
        return this.parseOrders (orders);
    }

    /**
     * @method
     * @name btcmarkets#cancelOrder
     * @description cancels an open order
     * @see https://docs.btcmarkets.net/v3/#operation/cancelOrder
     * @param {string} id order id
     * @param {string} symbol not used by btcmarket cancelOrder ()
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    async cancelOrder (id: string, symbol: Str = undefined, params = {}) {
        await this.loadMarkets ();
        const request: Dict = {
            'id': id,
        };
        const response = await this.privateDeleteOrdersId (this.extend (request, params));
        //
        //    {
        //        "orderId": "7524",
        //        "clientOrderId": "123-456"
        //    }
        //
        return this.parseOrder (response);
    }

    calculateFee (symbol, type, side, amount, price, takerOrMaker = 'taker', params = {}) {
        /**
         * @method
         * @description calculates the presumptive fee that would be charged for an order
         * @param {string} symbol unified market symbol
         * @param {string} type not used by btcmarkets.calculateFee
         * @param {string} side not used by btcmarkets.calculateFee
         * @param {float} amount how much you want to trade, in units of the base currency on most exchanges, or number of contracts
         * @param {float} price the price for the order to be filled at, in units of the quote currency
         * @param {string} takerOrMaker 'taker' or 'maker'
         * @param {object} params
         * @returns {object} contains the rate, the percentage multiplied to the order amount to obtain the fee amount, and cost, the total value of the fee in units of the quote currency, for the order
         */
        const market = this.markets[symbol];
        let currency = undefined;
        let cost = undefined;
        if (market['quote'] === 'AUD') {
            currency = market['quote'];
            const amountString = this.numberToString (amount);
            const priceString = this.numberToString (price);
            const otherUnitsAmount = Precise.stringMul (amountString, priceString);
            cost = this.costToPrecision (symbol, otherUnitsAmount);
        } else {
            currency = market['base'];
            cost = this.amountToPrecision (symbol, amount);
        }
        const rate = market[takerOrMaker];
        const rateCost = Precise.stringMul (this.numberToString (rate), cost);
        return {
            'type': takerOrMaker,
            'currency': currency,
            'rate': rate,
            'cost': parseFloat (this.feeToPrecision (symbol, rateCost)),
        };
    }

    parseOrderStatus (status: Str) {
        const statuses: Dict = {
            'Accepted': 'open',
            'Placed': 'open',
            'Partially Matched': 'open',
            'Fully Matched': 'closed',
            'Cancelled': 'canceled',
            'Partially Cancelled': 'canceled',
            'Failed': 'rejected',
        };
        return this.safeString (statuses, status, status);
    }

    parseOrder (order: Dict, market: Market = undefined): Order {
        //
        // createOrder
        //
        //     {
        //         "orderId": "7524",
        //         "marketId": "BTC-AUD",
        //         "side": "Bid",
        //         "type": "Limit",
        //         "creationTime": "2019-08-30T11:08:21.956000Z",
        //         "price": "100.12",
        //         "amount": "1.034",
        //         "openAmount": "1.034",
        //         "status": "Accepted",
        //         "clientOrderId": "1234-5678",
        //         "timeInForce": "IOC",
        //         "postOnly": false,
        //         "selfTrade": "P",
        //         "triggerAmount": "105",
        //         "targetAmount": "1000"
        //     }
        //
        const timestamp = this.parse8601 (this.safeString (order, 'creationTime'));
        const marketId = this.safeString (order, 'marketId');
        market = this.safeMarket (marketId, market, '-');
        let side = this.safeString (order, 'side');
        if (side === 'Bid') {
            side = 'buy';
        } else if (side === 'Ask') {
            side = 'sell';
        }
        const type = this.safeStringLower (order, 'type');
        const price = this.safeString (order, 'price');
        const amount = this.safeString (order, 'amount');
        const remaining = this.safeString (order, 'openAmount');
        const status = this.parseOrderStatus (this.safeString (order, 'status'));
        const id = this.safeString (order, 'orderId');
        const clientOrderId = this.safeString (order, 'clientOrderId');
        const timeInForce = this.safeString (order, 'timeInForce');
        const postOnly = this.safeBool (order, 'postOnly');
        return this.safeOrder ({
            'info': order,
            'id': id,
            'clientOrderId': clientOrderId,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'symbol': market['symbol'],
            'type': type,
            'timeInForce': timeInForce,
            'postOnly': postOnly,
            'side': side,
            'price': price,
            'triggerPrice': this.safeNumber (order, 'triggerPrice'),
            'cost': undefined,
            'amount': amount,
            'filled': undefined,
            'remaining': remaining,
            'average': undefined,
            'status': status,
            'trades': undefined,
            'fee': undefined,
        }, market);
    }

    /**
     * @method
     * @name btcmarkets#fetchOrder
     * @description fetches information on an order made by the user
     * @see https://docs.btcmarkets.net/v3/#operation/getOrderById
     * @param {string} id the order id
     * @param {string} symbol not used by btcmarkets fetchOrder
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    async fetchOrder (id: string, symbol: Str = undefined, params = {}) {
        await this.loadMarkets ();
        const request: Dict = {
            'id': id,
        };
        const response = await this.privateGetOrdersId (this.extend (request, params));
        return this.parseOrder (response);
    }

    /**
     * @method
     * @name btcmarkets#fetchOrders
     * @description fetches information on multiple orders made by the user
     * @see https://docs.btcmarkets.net/v3/#operation/listOrders
     * @param {string} symbol unified market symbol of the market orders were made in
     * @param {int} [since] the earliest time in ms to fetch orders for
     * @param {int} [limit] the maximum number of order structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    async fetchOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        await this.loadMarkets ();
        const request: Dict = {
            'status': 'all',
        };
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['marketId'] = market['id'];
        }
        if (since !== undefined) {
            request['after'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.privateGetOrders (this.extend (request, params));
        return this.parseOrders (response, market, since, limit);
    }

    /**
     * @method
     * @name btcmarkets#fetchOpenOrders
     * @description fetch all unfilled currently open orders
     * @see https://docs.btcmarkets.net/v3/#operation/listOrders
     * @param {string} symbol unified market symbol
     * @param {int} [since] the earliest time in ms to fetch open orders for
     * @param {int} [limit] the maximum number of  open orders structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    async fetchOpenOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        const request: Dict = { 'status': 'open' };
        return await this.fetchOrders (symbol, since, limit, this.extend (request, params));
    }

    /**
     * @method
     * @name btcmarkets#fetchClosedOrders
     * @description fetches information on multiple closed orders made by the user
     * @see https://docs.btcmarkets.net/v3/#operation/listOrders
     * @param {string} symbol unified market symbol of the market orders were made in
     * @param {int} [since] the earliest time in ms to fetch orders for
     * @param {int} [limit] the maximum number of order structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
     */
    async fetchClosedOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        const orders = await this.fetchOrders (symbol, since, limit, params);
        return this.filterBy (orders, 'status', 'closed') as Order[];
    }

    /**
     * @method
     * @name btcmarkets#fetchMyTrades
     * @description fetch all trades made by the user
     * @see https://docs.btcmarkets.net/v3/#operation/getTrades
     * @param {string} symbol unified market symbol
     * @param {int} [since] the earliest time in ms to fetch trades for
     * @param {int} [limit] the maximum number of trades structures to retrieve
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=trade-structure}
     */
    async fetchMyTrades (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        await this.loadMarkets ();
        const request: Dict = {};
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['marketId'] = market['id'];
        }
        if (since !== undefined) {
            request['after'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.privateGetTrades (this.extend (request, params));
        //
        //     [
        //         {
        //             "id": "36014819",
        //             "marketId": "XRP-AUD",
        //             "timestamp": "2019-06-25T16:01:02.977000Z",
        //             "price": "0.67",
        //             "amount": "1.50533262",
        //             "side": "Ask",
        //             "fee": "0.00857285",
        //             "orderId": "3648306",
        //             "liquidityType": "Taker",
        //             "clientOrderId": "48"
        //         },
        //         {
        //             "id": "3568960",
        //             "marketId": "GNT-AUD",
        //             "timestamp": "2019-06-20T08:44:04.488000Z",
        //             "price": "0.1362",
        //             "amount": "0.85",
        //             "side": "Bid",
        //             "fee": "0.00098404",
        //             "orderId": "3543015",
        //             "liquidityType": "Maker"
        //         }
        //     ]
        //
        return this.parseTrades (response, market, since, limit);
    }

    /**
     * @method
     * @name btcmarkets#withdraw
     * @description make a withdrawal
     * @see https://docs.btcmarkets.net/v3/#tag/Fund-Management-APIs/paths/~1v3~1withdrawals/post
     * @param {string} code unified currency code
     * @param {float} amount the amount to withdraw
     * @param {string} address the address to withdraw to
     * @param {string} tag
     * @param {object} [params] extra parameters specific to the exchange API endpoint
     * @returns {object} a [transaction structure]{@link https://docs.ccxt.com/#/?id=transaction-structure}
     */
    async withdraw (code: string, amount: number, address: string, tag = undefined, params = {}): Promise<Transaction> {
        [ tag, params ] = this.handleWithdrawTagAndParams (tag, params);
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request: Dict = {
            'currency_id': currency['id'],
            'amount': this.currencyToPrecision (code, amount),
        };
        if (code !== 'AUD') {
            this.checkAddress (address);
            request['toAddress'] = address;
        }
        if (tag !== undefined) {
            request['toAddress'] = address + '?dt=' + tag;
        }
        const response = await this.privatePostWithdrawals (this.extend (request, params));
        //
        //      {
        //          "id": "4126657",
        //          "assetName": "XRP",
        //          "amount": "25",
        //          "type": "Withdraw",
        //          "creationTime": "2019-09-04T00:04:10.973000Z",
        //          "status": "Pending Authorization",
        //          "description": "XRP withdraw from [me@test.com] to Address: abc amount: 25 fee: 0",
        //          "fee": "0",
        //          "lastUpdate": "2019-09-04T00:04:11.018000Z",
        //          "paymentDetail": {
        //              "address": "abc"
        //          }
        //      }
        //
        return this.parseTransaction (response, currency);
    }

    nonce () {
        return this.milliseconds ();
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let request = '/' + this.version + '/' + this.implodeParams (path, params);
        const query = this.keysort (this.omit (params, this.extractParams (path)));
        if (api === 'private') {
            this.checkRequiredCredentials ();
            const nonce = this.nonce ().toString ();
            const secret = this.base64ToBinary (this.secret);
            let auth = method + request + nonce;
            if ((method === 'GET') || (method === 'DELETE')) {
                if (Object.keys (query).length) {
                    request += '?' + this.urlencode (query);
                }
            } else {
                body = this.json (query);
                auth += body;
            }
            const signature = this.hmac (this.encode (auth), secret, sha512, 'base64');
            headers = {
                'Accept': 'application/json',
                'Accept-Charset': 'UTF-8',
                'Content-Type': 'application/json',
                'BM-AUTH-APIKEY': this.apiKey,
                'BM-AUTH-TIMESTAMP': nonce,
                'BM-AUTH-SIGNATURE': signature,
            };
        } else if (api === 'public') {
            if (Object.keys (query).length) {
                request += '?' + this.urlencode (query);
            }
        }
        const url = this.urls['api'][api] + request;
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code: int, reason: string, url: string, method: string, headers: Dict, body: string, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return undefined; // fallback to default error handler
        }
        //
        //     {"code":"UnAuthorized","message":"invalid access token"}
        //     {"code":"MarketNotFound","message":"invalid marketId"}
        //
        const errorCode = this.safeString (response, 'code');
        const message = this.safeString (response, 'message');
        if (errorCode !== undefined) {
            const feedback = this.id + ' ' + body;
            this.throwExactlyMatchedException (this.exceptions['exact'], message, feedback);
            this.throwExactlyMatchedException (this.exceptions['exact'], errorCode, feedback);
            this.throwBroadlyMatchedException (this.exceptions['broad'], message, feedback);
            throw new ExchangeError (feedback); // unknown message
        }
        return undefined;
    }
}

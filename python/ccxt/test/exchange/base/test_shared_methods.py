import os
import sys

root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
sys.path.append(root)

# ----------------------------------------------------------------------------

# PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
# https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

# ----------------------------------------------------------------------------
# -*- coding: utf-8 -*-

from ccxt.base.decimal_to_precision import DECIMAL_PLACES  # noqa E402
from ccxt.base.decimal_to_precision import TICK_SIZE  # noqa E402
import numbers  # noqa E402
import json  # noqa E402
from ccxt.base.precise import Precise  # noqa E402
from ccxt.base.errors import OnMaintenance  # noqa E402
from ccxt.base.errors import OperationFailed  # noqa E402

def log_template(exchange, method, entry):
    # there are cases when exchange is undefined (eg. base tests)
    id = exchange.id if (exchange is not None) else 'undefined'
    method_string = method if (method is not None) else 'undefined'
    entry_string = exchange.json(entry) if (exchange is not None) else ''
    return ' <<< ' + id + ' ' + method_string + ' ::: ' + entry_string + ' >>> '


def is_temporary_failure(e):
    return (isinstance(e, OperationFailed)) and (not (isinstance(e, OnMaintenance)))


def string_value(value):
    string_val = None
    if isinstance(value, str):
        string_val = value
    elif value is None:
        string_val = 'undefined'
    else:
        string_val = str(value)
    return string_val


def assert_type(exchange, skipped_properties, entry, key, format):
    if key in skipped_properties:
        return None
    # because "typeof" string is not transpilable without === 'name', we list them manually at this moment
    entry_key_val = exchange.safe_value(entry, key)
    format_key_val = exchange.safe_value(format, key)
    same_string = (isinstance(entry_key_val, str)) and (isinstance(format_key_val, str))
    same_numeric = (isinstance(entry_key_val, numbers.Real)) and (isinstance(format_key_val, numbers.Real))
    same_boolean = ((entry_key_val) or (entry_key_val is False)) and ((format_key_val) or (format_key_val is False))
    same_array = isinstance(entry_key_val, list) and isinstance(format_key_val, list)
    same_object = (isinstance(entry_key_val, dict)) and (isinstance(format_key_val, dict))
    result = (entry_key_val is None) or same_string or same_numeric or same_boolean or same_array or same_object
    return result


def assert_structure(exchange, skipped_properties, method, entry, format, empty_allowed_for=None, deep=False):
    log_text = log_template(exchange, method, entry)
    assert entry is not None, 'item is null/undefined' + log_text
    # get all expected & predefined keys for this specific item and ensure thos ekeys exist in parsed structure
    allow_empty_skips = exchange.safe_list(skipped_properties, 'allowNull', [])
    if empty_allowed_for is not None:
        empty_allowed_for = concat(empty_allowed_for, allow_empty_skips)
    if isinstance(format, list):
        assert isinstance(entry, list), 'entry is not an array' + log_text
        real_length = len(entry)
        expected_length = len(format)
        assert real_length == expected_length, 'entry length is not equal to expected length of ' + str(expected_length) + log_text
        for i in range(0, len(format)):
            empty_allowed_for_this_key = (empty_allowed_for is None) or exchange.in_array(i, empty_allowed_for)
            value = entry[i]
            if i in skipped_properties:
                continue
            # check when:
            # - it's not inside "allowe empty values" list
            # - it's not undefined
            if empty_allowed_for_this_key and (value is None):
                continue
            assert value is not None, str(i) + ' index is expected to have a value' + log_text
            # because of other langs, this is needed for arrays
            type_assertion = assert_type(exchange, skipped_properties, entry, i, format)
            assert type_assertion, str(i) + ' index does not have an expected type ' + log_text
    else:
        assert isinstance(entry, dict), 'entry is not an object' + log_text
        keys = list(format.keys())
        for i in range(0, len(keys)):
            key = keys[i]
            if key in skipped_properties:
                continue
            assert key in entry, '"' + string_value(key) + '" key is missing from structure' + log_text
            if key in skipped_properties:
                continue
            empty_allowed_for_this_key = (empty_allowed_for is None) or exchange.in_array(key, empty_allowed_for)
            value = entry[key]
            # check when:
            # - it's not inside "allowe empty values" list
            # - it's not undefined
            if empty_allowed_for_this_key and (value is None):
                continue
            # if it was in needed keys, then it should have value.
            assert value is not None, '"' + string_value(key) + '" key is expected to have a value' + log_text
            # add exclusion for info key, as it can be any type
            if key != 'info':
                type_assertion = assert_type(exchange, skipped_properties, entry, key, format)
                assert type_assertion, '"' + string_value(key) + '" key is neither undefined, neither of expected type' + log_text
                if deep:
                    if isinstance(value, dict):
                        assert_structure(exchange, skipped_properties, method, value, format[key], empty_allowed_for, deep)


def assert_timestamp(exchange, skipped_properties, method, entry, now_to_check=None, key_name_or_index='timestamp', allow_null=True):
    log_text = log_template(exchange, method, entry)
    skip_value = exchange.safe_value(skipped_properties, key_name_or_index)
    if skip_value is not None:
        return   # skipped
    is_date_time_object = isinstance(key_name_or_index, str)
    if is_date_time_object:
        assert (key_name_or_index in entry), 'timestamp key "' + key_name_or_index + '" is missing from structure' + log_text
    else:
        # if index was provided (mostly from fetchOHLCV) then we check if it exists, as mandatory
        assert not (entry[key_name_or_index] is None), 'timestamp index ' + string_value(key_name_or_index) + ' is undefined' + log_text
    ts = entry[key_name_or_index]
    assert ts is not None or allow_null, 'timestamp is null' + log_text
    if ts is not None:
        assert isinstance(ts, numbers.Real), 'timestamp is not numeric' + log_text
        assert isinstance(ts, int), 'timestamp should be an integer' + log_text
        min_ts = 1230940800000  # 03 Jan 2009 - first block
        max_ts = 2147483648000  # 19 Jan 2038 - max int
        assert ts > min_ts, 'timestamp is impossible to be before ' + str(min_ts) + ' (03.01.2009)' + log_text  # 03 Jan 2009 - first block
        assert ts < max_ts, 'timestamp more than ' + str(max_ts) + ' (19.01.2038)' + log_text  # 19 Jan 2038 - int32 overflows # 7258118400000  -> Jan 1 2200
        if now_to_check is not None:
            max_ms_offset = 60000  # 1 min
            assert ts < now_to_check + max_ms_offset, 'returned item timestamp (' + exchange.iso8601(ts) + ') is ahead of the current time (' + exchange.iso8601(now_to_check) + ')' + log_text


def assert_timestamp_and_datetime(exchange, skipped_properties, method, entry, now_to_check=None, key_name_or_index='timestamp', allow_null=True):
    log_text = log_template(exchange, method, entry)
    skip_value = exchange.safe_value(skipped_properties, key_name_or_index)
    if skip_value is not None:
        return
    assert_timestamp(exchange, skipped_properties, method, entry, now_to_check, key_name_or_index)
    is_date_time_object = isinstance(key_name_or_index, str)
    # only in case if the entry is a dictionary, thus it must have 'timestamp' & 'datetime' string keys
    if is_date_time_object:
        # we also test 'datetime' here because it's certain sibling of 'timestamp'
        assert ('datetime' in entry), '"datetime" key is missing from structure' + log_text
        dt = entry['datetime']
        assert dt is not None or allow_null, 'timestamp is null' + log_text
        if dt is not None:
            assert isinstance(dt, str), '"datetime" key does not have a string value' + log_text
            # there are exceptional cases, like getting microsecond-targeted string '2022-08-08T22:03:19.014680Z', so parsed unified timestamp, which carries only 13 digits (millisecond precision) can not be stringified back to microsecond accuracy, causing the bellow assertion to fail
            #    assert (dt === exchange.iso8601 (entry['timestamp']))
            # so, we have to compare with millisecond accururacy
            dt_parsed = exchange.parse8601(dt)
            dt_parsed_string = exchange.iso8601(dt_parsed)
            dt_entry_string = exchange.iso8601(entry['timestamp'])
            assert dt_parsed_string == dt_entry_string, 'datetime is not iso8601 of timestamp:' + dt_parsed_string + '(string) != ' + dt_entry_string + '(from ts)' + log_text


def assert_currency_code(exchange, skipped_properties, method, entry, actual_code, expected_code=None, allow_null=True):
    if ('currency' in skipped_properties) or ('currencyIdAndCode' in skipped_properties):
        return
    log_text = log_template(exchange, method, entry)
    assert actual_code is not None or allow_null, 'currency code is null' + log_text
    if actual_code is not None:
        assert isinstance(actual_code, str), 'currency code should be either undefined or a string' + log_text
        assert (actual_code in exchange.currencies), 'currency code ("' + actual_code + '") should be present in exchange.currencies' + log_text
        if expected_code is not None:
            assert actual_code == expected_code, 'currency code in response ("' + string_value(actual_code) + '") should be equal to expected code ("' + string_value(expected_code) + '")' + log_text


def assert_valid_currency_id_and_code(exchange, skipped_properties, method, entry, currency_id, currency_code, allow_null=True):
    # this is exclusive exceptional key name to be used in `skip-tests.json`, to skip check for currency id and code
    if ('currency' in skipped_properties) or ('currencyIdAndCode' in skipped_properties):
        return
    log_text = log_template(exchange, method, entry)
    undefined_values = currency_id is None and currency_code is None
    defined_values = currency_id is not None and currency_code is not None
    assert undefined_values or defined_values, 'currencyId and currencyCode should be either both defined or both undefined' + log_text
    assert defined_values or allow_null, 'currency code and id is not defined' + log_text
    if defined_values:
        # check by code
        currency_by_code = exchange.currency(currency_code)
        assert currency_by_code['id'] == currency_id, 'currencyId "' + string_value(currency_id) + '" does not match currency id from instance: "' + string_value(currency_by_code['id']) + '"' + log_text
        # check by id
        currency_by_id = exchange.safe_currency(currency_id)
        assert currency_by_id['code'] == currency_code, 'currencyCode ' + string_value(currency_code) + ' does not match currency of id: ' + string_value(currency_id) + log_text


def assert_symbol(exchange, skipped_properties, method, entry, key, expected_symbol=None, allow_null=True):
    if key in skipped_properties:
        return
    log_text = log_template(exchange, method, entry)
    actual_symbol = exchange.safe_string(entry, key)
    if actual_symbol is not None:
        assert isinstance(actual_symbol, str), 'symbol should be either undefined or a string' + log_text
    if expected_symbol is not None:
        assert actual_symbol == expected_symbol, 'symbol in response ("' + string_value(actual_symbol) + '") should be equal to expected symbol ("' + string_value(expected_symbol) + '")' + log_text
    defined_values = actual_symbol is not None and expected_symbol is not None
    assert defined_values or allow_null, 'symbols are not defined' + log_text


def assert_symbol_in_markets(exchange, skipped_properties, method, symbol):
    log_text = log_template(exchange, method, {})
    assert (symbol in exchange.markets), 'symbol should be present in exchange.symbols' + log_text


def assert_greater(exchange, skipped_properties, method, entry, key, compare_to, allow_null=True):
    if key in skipped_properties:
        return
    log_text = log_template(exchange, method, entry)
    value = exchange.safe_string(entry, key)
    assert value is not None or allow_null, 'value is null' + log_text
    if value is not None:
        assert Precise.string_gt(value, compare_to), string_value(key) + ' key (with a value of ' + string_value(value) + ') was expected to be > ' + string_value(compare_to) + log_text


def assert_greater_or_equal(exchange, skipped_properties, method, entry, key, compare_to, allow_null=True):
    if key in skipped_properties:
        return
    log_text = log_template(exchange, method, entry)
    value = exchange.safe_string(entry, key)
    assert value is not None or allow_null, 'value is null' + log_text
    if value is not None and compare_to is not None:
        assert Precise.string_ge(value, compare_to), string_value(key) + ' key (with a value of ' + string_value(value) + ') was expected to be >= ' + string_value(compare_to) + log_text


def assert_less(exchange, skipped_properties, method, entry, key, compare_to, allow_null=True):
    if key in skipped_properties:
        return
    log_text = log_template(exchange, method, entry)
    value = exchange.safe_string(entry, key)
    assert value is not None or allow_null, 'value is null' + log_text
    if value is not None and compare_to is not None:
        assert Precise.string_lt(value, compare_to), string_value(key) + ' key (with a value of ' + string_value(value) + ') was expected to be < ' + string_value(compare_to) + log_text


def assert_less_or_equal(exchange, skipped_properties, method, entry, key, compare_to, allow_null=True):
    if key in skipped_properties:
        return
    log_text = log_template(exchange, method, entry)
    value = exchange.safe_string(entry, key)
    assert value is not None or allow_null, 'value is null' + log_text
    if value is not None and compare_to is not None:
        assert Precise.string_le(value, compare_to), string_value(key) + ' key (with a value of ' + string_value(value) + ') was expected to be <= ' + string_value(compare_to) + log_text


def assert_equal(exchange, skipped_properties, method, entry, key, compare_to, allow_null=True):
    if key in skipped_properties:
        return
    log_text = log_template(exchange, method, entry)
    value = exchange.safe_string(entry, key)
    assert value is not None or allow_null, 'value is null' + log_text
    if value is not None and compare_to is not None:
        assert Precise.string_eq(value, compare_to), string_value(key) + ' key (with a value of ' + string_value(value) + ') was expected to be equal to ' + string_value(compare_to) + log_text


def assert_non_equal(exchange, skipped_properties, method, entry, key, compare_to, allow_null=True):
    if key in skipped_properties:
        return
    log_text = log_template(exchange, method, entry)
    value = exchange.safe_string(entry, key)
    assert value is not None or allow_null, 'value is null' + log_text
    if value is not None:
        assert not Precise.string_eq(value, compare_to), string_value(key) + ' key (with a value of ' + string_value(value) + ') was expected not to be equal to ' + string_value(compare_to) + log_text


def assert_in_array(exchange, skipped_properties, method, entry, key, expected_array, allow_null=True):
    if key in skipped_properties:
        return
    log_text = log_template(exchange, method, entry)
    value = exchange.safe_value(entry, key)
    assert value is not None or allow_null, 'value is null' + log_text
    # todo: remove undefined check
    if value is not None:
        stingified_array_value = exchange.json(expected_array)  # don't use expectedArray.join (','), as it bugs in other languages, if values are bool, undefined or etc..
        assert exchange.in_array(value, expected_array), '"' + string_value(key) + '" key (value "' + string_value(value) + '") is not from the expected list : [' + stingified_array_value + ']' + log_text


def assert_fee_structure(exchange, skipped_properties, method, entry, key, allow_null=True):
    log_text = log_template(exchange, method, entry)
    key_string = string_value(key)
    if isinstance(key, int):
        key = key
        assert isinstance(entry, list), 'fee container is expected to be an array' + log_text
        assert key < len(entry), 'fee key ' + key_string + ' was expected to be present in entry' + log_text
    else:
        assert isinstance(entry, dict), 'fee container is expected to be an object' + log_text
        assert key in entry, 'fee key "' + key + '" was expected to be present in entry' + log_text
    fee_object = exchange.safe_value(entry, key)
    assert fee_object is not None or allow_null, 'fee object is null' + log_text
    # todo: remove undefined check to make stricter
    if fee_object is not None:
        assert 'cost' in fee_object, key_string + ' fee object should contain "cost" key' + log_text
        if fee_object['cost'] is None:
            return   # todo: remove undefined check to make stricter
        assert isinstance(fee_object['cost'], numbers.Real), key_string + ' "cost" must be numeric type' + log_text
        # assertGreaterOrEqual (exchange, skippedProperties, method, feeObject, 'cost', '0'); # fee might be negative in the case of a rebate or reward
        assert 'currency' in fee_object, '"' + key_string + '" fee object should contain "currency" key' + log_text
        assert_currency_code(exchange, skipped_properties, method, entry, fee_object['currency'])


def assert_timestamp_order(exchange, method, code_or_symbol, items, ascending=True):
    for i in range(0, len(items)):
        if i > 0:
            current_ts = items[i - 1]['timestamp']
            next_ts = items[i]['timestamp']
            if current_ts is not None and next_ts is not None:
                ascending_or_descending = 'ascending' if ascending else 'descending'
                comparison = (current_ts <= next_ts) if ascending else (current_ts >= next_ts)
                assert comparison, exchange.id + ' ' + method + ' ' + string_value(code_or_symbol) + ' must return a ' + ascending_or_descending + ' sorted array of items by timestamp, but ' + str(current_ts) + ' is opposite with its next ' + str(next_ts) + ' ' + exchange.json(items)


def assert_integer(exchange, skipped_properties, method, entry, key, allow_null=True):
    if key in skipped_properties:
        return
    log_text = log_template(exchange, method, entry)
    if entry is not None:
        value = exchange.safe_value(entry, key)
        assert value is not None or allow_null, 'value is null' + log_text
        if value is not None:
            is_integer = isinstance(value, int)
            assert is_integer, '"' + string_value(key) + '" key (value "' + string_value(value) + '") is not an integer' + log_text


def check_precision_accuracy(exchange, skipped_properties, method, entry, key):
    if key in skipped_properties:
        return
    if exchange.is_tick_precision():
        # TICK_SIZE should be above zero
        assert_greater(exchange, skipped_properties, method, entry, key, '0')
        # the below array of integers are inexistent tick-sizes (theoretically technically possible, but not in real-world cases), so their existence in our case indicates to incorrectly implemented tick-sizes, which might mistakenly be implemented with DECIMAL_PLACES, so we throw error
        decimal_numbers = ['2', '3', '4', '5', '6', '7', '8', '9', '11', '12', '13', '14', '15', '16']
        for i in range(0, len(decimal_numbers)):
            num = decimal_numbers[i]
            num_str = num
            assert_non_equal(exchange, skipped_properties, method, entry, key, num_str)
    else:
        # todo: significant-digits return doubles from `this.parseNumber`, so for now can't assert against integer atm
        # assertInteger (exchange, skippedProperties, method, entry, key); # should be integer
        assert_less_or_equal(exchange, skipped_properties, method, entry, key, '18')  # should be under 18 decimals
        assert_greater_or_equal(exchange, skipped_properties, method, entry, key, '-8')  # in real-world cases, there would not be less than that


def fetch_best_bid_ask(exchange, method, symbol):
    log_text = log_template(exchange, method, {})
    # find out best bid/ask price
    best_bid = None
    best_ask = None
    used_method = None
    if exchange.has['fetchOrderBook']:
        used_method = 'fetchOrderBook'
        orderbook = exchange.fetch_order_book(symbol)
        bids = exchange.safe_list(orderbook, 'bids')
        asks = exchange.safe_list(orderbook, 'asks')
        best_bid_array = exchange.safe_list(bids, 0)
        best_ask_array = exchange.safe_list(asks, 0)
        best_bid = exchange.safe_number(best_bid_array, 0)
        best_ask = exchange.safe_number(best_ask_array, 0)
    elif exchange.has['fetchBidsAsks']:
        used_method = 'fetchBidsAsks'
        tickers = exchange.fetch_bids_asks([symbol])
        ticker = exchange.safe_dict(tickers, symbol)
        best_bid = exchange.safe_number(ticker, 'bid')
        best_ask = exchange.safe_number(ticker, 'ask')
    elif exchange.has['fetchTicker']:
        used_method = 'fetchTicker'
        ticker = exchange.fetch_ticker(symbol)
        best_bid = exchange.safe_number(ticker, 'bid')
        best_ask = exchange.safe_number(ticker, 'ask')
    elif exchange.has['fetchTickers']:
        used_method = 'fetchTickers'
        tickers = exchange.fetch_tickers([symbol])
        ticker = exchange.safe_dict(tickers, symbol)
        best_bid = exchange.safe_number(ticker, 'bid')
        best_ask = exchange.safe_number(ticker, 'ask')
    #
    assert best_bid is not None and best_ask is not None, log_text + ' ' + exchange.id + ' could not get best bid/ask for ' + symbol + ' using ' + used_method + ' while testing ' + method
    return [best_bid, best_ask]


def fetch_order(exchange, symbol, order_id, skipped_properties):
    fetched_order = None
    original_id = order_id
    # set 'since' to 5 minute ago for optimal results
    since_time = exchange.milliseconds() - 1000 * 60 * 5
    # iterate
    methods_singular = ['fetchOrder', 'fetchOpenOrder', 'fetchClosedOrder', 'fetchCanceledOrder']
    for i in range(0, len(methods_singular)):
        singular_fetch_name = methods_singular[i]
        if exchange.has[singular_fetch_name]:
            current_order = exchange[singular_fetch_name](original_id, symbol)
            # if there is an id inside the order, it means the order was fetched successfully
            if current_order['id'] == original_id:
                fetched_order = current_order
                break
    #
    # search through plural methods
    if fetched_order is None:
        methods_plural = ['fetchOrders', 'fetchOpenOrders', 'fetchClosedOrders', 'fetchCanceledOrders']
        for i in range(0, len(methods_plural)):
            plural_fetch_name = methods_plural[i]
            if exchange.has[plural_fetch_name]:
                orders = exchange[plural_fetch_name](symbol, since_time)
                found = False
                for j in range(0, len(orders)):
                    current_order = orders[j]
                    if current_order['id'] == original_id:
                        fetched_order = current_order
                        found = True
                        break
                if found:
                    break
    return fetched_order


def assert_order_state(exchange, skipped_properties, method, order, asserted_status, strict_check):
    # note, `strictCheck` is `true` only from "fetchOrder" cases
    log_text = log_template(exchange, method, order)
    msg = 'order should be ' + asserted_status + ', but it was not asserted' + log_text
    filled = exchange.safe_string(order, 'filled')
    amount = exchange.safe_string(order, 'amount')
    # shorthand variables
    status_undefined = (order['status'] is None)
    status_open = (order['status'] == 'open')
    status_closed = (order['status'] == 'closed')
    status_clanceled = (order['status'] == 'canceled')
    filled_defined = (filled is not None)
    amount_defined = (amount is not None)
    condition = None
    #
    # ### OPEN STATUS
    #
    # if strict check, then 'status' must be 'open' and filled amount should be less then whole order amount
    strict_open = status_open and (filled_defined and amount_defined and filled < amount)
    # if non-strict check, then accept & ignore undefined values
    nonstrict_open = (status_open or status_undefined) and ((not filled_defined or not amount_defined) or Precise.string_lt(filled, amount))
    # check
    if asserted_status == 'open':
        condition = strict_open if strict_check else nonstrict_open
        assert condition, msg
        return
    #
    # ### CLOSED STATUS
    #
    # if strict check, then 'status' must be 'closed' and filled amount should be equal to the whole order amount
    closed_strict = status_closed and (filled_defined and amount_defined and Precise.string_eq(filled, amount))
    # if non-strict check, then accept & ignore undefined values
    closed_non_strict = (status_closed or status_undefined) and ((not filled_defined or not amount_defined) or Precise.string_eq(filled, amount))
    # check
    if asserted_status == 'closed':
        condition = closed_strict if strict_check else closed_non_strict
        assert condition, msg
        return
    #
    # ### CANCELED STATUS
    #
    # if strict check, then 'status' must be 'canceled' and filled amount should be less then whole order amount
    canceled_strict = status_clanceled and (filled_defined and amount_defined and Precise.string_lt(filled, amount))
    # if non-strict check, then accept & ignore undefined values
    canceled_non_strict = (status_clanceled or status_undefined) and ((not filled_defined or not amount_defined) or Precise.string_lt(filled, amount))
    # check
    if asserted_status == 'canceled':
        condition = canceled_strict if strict_check else canceled_non_strict
        assert condition, msg
        return
    #
    # ### CLOSED_or_CANCELED STATUS
    #
    if asserted_status == 'closed_or_canceled':
        condition = (closed_strict or canceled_strict) if strict_check else (closed_non_strict or canceled_non_strict)
        assert condition, msg
        return


def get_active_markets(exchange, include_unknown=True):
    filtered_active = exchange.filter_by(exchange.markets, 'active', True)
    if include_unknown:
        filtered_undefined = exchange.filter_by(exchange.markets, 'active', None)
        return exchange.array_concat(filtered_active, filtered_undefined)
    return filtered_active


def remove_proxy_options(exchange, skipped_properties):
    proxy_url = exchange.check_proxy_url_settings()
    [http_proxy, https_proxy, socks_proxy] = exchange.check_proxy_settings()
    # because of bug in transpiled, about `.proxyUrl` being transpiled into `.proxy_url`, we have to use this workaround
    exchange.set_property(exchange, 'proxyUrl', None)
    exchange.set_property(exchange, 'proxy_url', None)
    exchange.set_property(exchange, 'httpProxy', None)
    exchange.set_property(exchange, 'http_proxy', None)
    exchange.set_property(exchange, 'httpsProxy', None)
    exchange.set_property(exchange, 'https_proxy', None)
    exchange.set_property(exchange, 'socksProxy', None)
    exchange.set_property(exchange, 'socks_proxy', None)
    return [proxy_url, http_proxy, https_proxy, socks_proxy]


def set_proxy_options(exchange, skipped_properties, proxy_url, http_proxy, https_proxy, socks_proxy):
    exchange.proxy_url = proxy_url
    exchange.http_proxy = http_proxy
    exchange.https_proxy = https_proxy
    exchange.socks_proxy = socks_proxy


def concat(a=None, b=None):
    # we use this method temporarily, because of ast-transpiler issue across langs
    if a is None:
        return b
    elif b is None:
        return a
    else:
        result = []
        for i in range(0, len(a)):
            result.append(a[i])
        for j in range(0, len(b)):
            result.append(b[j])
        return result


def assert_non_emtpy_array(exchange, skipped_properties, method, entry, hint=None):
    log_text = log_template(exchange, method, entry)
    if hint is not None:
        log_text = log_text + ' ' + hint
    assert isinstance(entry, list), 'response is expected to be an array' + log_text
    if not ('emptyResponse' in skipped_properties):
        return
    assert len(entry) > 0, 'response is expected to be a non-empty array' + log_text + ' (add "emptyResponse" in skip-tests.json to skip this check)'


def assert_round_minute_timestamp(exchange, skipped_properties, method, entry, key):
    if key in skipped_properties:
        return
    log_text = log_template(exchange, method, entry)
    ts = exchange.safe_string(entry, key)
    assert Precise.string_mod(ts, '60000') == '0', 'timestamp should be a multiple of 60 seconds (1 minute)' + log_text


def deep_equal(a, b):
    return json.dumps(a) == json.dumps(b)


def assert_deep_equal(exchange, skipped_properties, method, a, b):
    log_text = log_template(exchange, method, {})
    assert deep_equal(a, b), 'two dicts do not match: ' + json.dumps(a) + ' != ' + json.dumps(b) + log_text

'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы or и and
 */
exports.isStar = true;

var FUNCTIONS_PRIORITY = { 'select': 1, 'format': 1, 'limit': 1,
    'or': 0, 'and': 0, 'filterIn': 0, 'sortBy': 0 };

function copyObjectFields(object, fields) {
    if (!fields) {
        fields = Object.keys(object);
    }
    var newObject = {};
    fields.forEach(function (item) {
        if (object.hasOwnProperty(item)) {
            newObject[item] = object[item];
        }
    });

    return newObject;
}

function copyObjectsArray(array) {
    return array.map(function (item) {
        return copyObjectFields(item);
    });
}

function sortFunctions(functions) {
    return functions.sort(function (a, b) {
        return Math.sign(FUNCTIONS_PRIORITY[a.name] - FUNCTIONS_PRIORITY[b.name]);
    });
}

function unionArrays(arr1, arr2) {
    arr2.forEach(function (item) {
        if (arr1.indexOf(item) < 0) {
            arr1.push(item);
        }
    });

    return arr1;
}

/**
 * Запрос к коллекции
 * @param {Array} collection
 * @params {...Function} – Функции для запроса
 * @returns {Array}
 */
exports.query = function (collection) {
    var newCollection = copyObjectsArray(collection);
    var functions = [].slice.call(arguments, 1);
    functions = sortFunctions(functions);
    functions.forEach(function (item) {
        newCollection = item.function(newCollection);
    });

    return newCollection;
};

/**
 * Выбор полей
 * @params {...String}
 * @returns {{name: string, function: Function}}
 */
exports.select = function () {
    var fields = [].slice.call(arguments);

    return { name: 'select', function: function (collection) {
        var newCollection = [];
        collection.forEach(function (item) {
            newCollection.push(copyObjectFields(item, fields));
        });

        return newCollection;
    } };
};

/**
 * Фильтрация поля по массиву значений
 * @param {String} property – Свойство для фильтрации
 * @param {Array} values – Доступные значения
 * @returns {{name: string, function: Function}}
 */
exports.filterIn = function () {
    var string = arguments[0];
    var array = arguments[1];

    return { name: 'filterIn', function: function (collection) {
        var newCollection = [];
        collection.forEach(function (item) {
            if (array.indexOf(item[string]) >= 0) {
                newCollection.push(item);
            }
        });

        return newCollection;
    } };
};

/**
 * Сортировка коллекции по полю
 * @param {String} property – Свойство для фильтрации
 * @param {String} order – Порядок сортировки (asc - по возрастанию; desc – по убыванию)
 * @returns {{name: string, function: Function}}
 */
exports.sortBy = function () {
    var property = arguments[0];
    var order = arguments[1];

    return { name: 'sortBy', function: function (collection) {
        collection.sort(function (a, b) {
            var sign = a[property] > b[property] ? 1 : -1;

            return order === 'asc' ? sign : -sign;
        });

        return collection;
    } };
};

/**
 * Форматирование поля
 * @param {String} property – Свойство для фильтрации
 * @param {Function} formatter – Функция для форматирования
 * @returns {{name: string, function: Function}}
 */
exports.format = function () {
    var property = arguments[0];
    var func = arguments[1];

    return { name: 'format', function: function (collection) {
        collection.forEach(function (item) {
            item[property] = func(item[property]);
        });

        return collection;
    } };
};

/**
 * Ограничение количества элементов в коллекции
 * @param {Number} count – Максимальное количество элементов
 * @returns {{name: string, function: Function}}
 */
exports.limit = function () {
    var count = arguments[0];

    return { name: 'limit', function: function (collection) {
        return collection.slice(0, count);
    } };
};

if (exports.isStar) {

    /**
     * Фильтрация, объединяющая фильтрующие функции
     * @star
     * @params {...Function} – Фильтрующие функции
     * @returns {{name: string, function: Function}}
     */
    exports.or = function () {
        var functions = [].slice.call(arguments);

        return { name: 'or', function: function (collection) {
            return functions.reduce(function (acc, item) {
                return unionArrays(acc, item.function(collection));
            },
            []);
        } };
    };

    /**
     * Фильтрация, пересекающая фильтрующие функции
     * @star
     * @params {...Function} – Фильтрующие функции
     * @returns {{name: string, function: Function}}
     */
    exports.and = function () {
        var functions = [].slice.call(arguments);

        return { name: 'or', function: function (collection) {
            functions.forEach(function (item) {
                collection = item.function(collection);
            });

            return collection;
        } };
    };
}

var express = require('express');
var router = express.Router();
var config = require('nconf');
var db = require('../db');

/**
 * Error helper
 */
function error(err) {
    return {
        name: err.name,
        message: err.message
    };
}

/**
 * Check permission for access to collection
 * 
 * @param req.params.collection
 * @param req.headers['x-access-token']
 * @return req.query.select
 * @return req.query.populate
 */
router.checkPermissions = function(req, res, next) {
    var token = config.get('rest:' + req.headers['x-access-token']);
    if (!token) return res.status(401).end();
    var params = token[req.params.collection];
    if (!params) return res.status(403).end();
    switch (req.method) {
        case 'GET':
            if (!params.read) return res.status(403).end();
            if (typeof params.read.query !== 'undefined') res.locals.query = params.read.query;
            if (typeof params.read.skip !== 'undefined') res.locals.skip = params.read.skip;
            if (typeof params.read.limit !== 'undefined') res.locals.limit = params.read.limit;
            if (typeof params.read.sort !== 'undefined') res.locals.sort = params.read.sort;
            if (typeof params.read.select !== 'undefined') res.locals.select = params.read.select;
            if (typeof params.read.populate !== 'undefined') res.locals.populate = params.read.populate;
            break;
        case 'POST':
            if (!params.create) return res.status(403).end();
            break;
        case 'PUT':
            if (!params.update) return res.status(403).end();
            break;
        case 'DELETE':
            if (!params.delete) return res.status(403).end();
            break;
        default:
            return res.status(403).end();
    }
    next();
};

/**
 * CORS middleware
 */
router.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,X-Access-Token');
    next();
});

/**
 * Create document
 * 
 * @param req.params.collection
 * @param req.body
 * @return Object
 */
router.post('/:collection',
    router.checkPermissions,
    function(req, res) {
        var args = {
            collection: req.params.collection,
            data: req.body
        };
        // create document
        db.rest.create(args, function(err, data) {
            if (err) return res.status(400).json(error(err));
            res.json(data);
        });
    });

/**
 * Read documents from collection
 * 
 * @param req.params.collection
 * @param req.query.query
 * @param req.query.skip
 * @param req.query.limit
 * @param req.query.sort
 * @param req.query.select
 * @param req.query.populate
 * @return Array
 */
router.get('/:collection',
    router.checkPermissions,
    function(req, res) {
        var args = {
            collection: req.params.collection,
            query: res.locals.query,
            skip: res.locals.skip,
            limit: res.locals.limit,
            sort: res.locals.sort,
            select: res.locals.select,
            populate: res.locals.populate
        };
        // parse query
        try {
            if (typeof args.query === 'undefined' && req.query.query) {
                args.query = JSON.parse(req.query.query);
            }
            if (typeof args.skip === 'undefined' && req.query.skip) {
                args.skip = Number(req.query.skip);
            }
            if (typeof args.limit === 'undefined' && req.query.limit) {
                args.limit = Number(req.query.limit);
            }
            if (typeof args.sort === 'undefined' && req.query.sort) {
                args.sort = JSON.parse(req.query.sort);
            }
            if (typeof args.select === 'undefined' && req.query.select) {
                args.select = JSON.parse(req.query.select);
            }
            if (typeof args.populate === 'undefined' && req.query.populate) {
                args.populate = JSON.parse(req.query.populate);
            }
        }
        catch (err) {
            return res.status(400).json(error(err));
        }
        // execute query
        db.rest.read(args, function(err, data) {
            if (err) return res.status(400).json(error(err));
            res.json(data);
        });
    });

/**
 * Update document by id
 * 
 * @param req.params.collection
 * @param req.params.documentId
 * @param req.body
 * @return Object
 */
router.put('/:collection/:documentId',
    router.checkPermissions,
    function(req, res) {
        var args = {
            collection: req.params.collection,
            documentId: req.params.documentId,
            data: req.body
        };
        // update document
        db.rest.update(args, function(err, data) {
            if (err) return res.status(400).json(error(err));
            res.json(data);
        });
    });

/**
 * Delete document by id
 * 
 * @param req.params.collection
 * @param req.params.documentId
 * @return Object
 */
router.delete('/:collection/:documentId',
    router.checkPermissions,
    function(req, res) {
        var args = {
            collection: req.params.collection,
            documentId: req.params.documentId
        };
        // remove document
        db.rest.delete(args, function(err, data) {
            if (err) return res.status(400).json(error(err));
            res.json(data);
        });
    });

module.exports = router;

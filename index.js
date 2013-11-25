var mongoose = require('mongoose'),
  moment = require('moment'),
  _ = require("underscore"),
  ObjectId = mongoose.Types.ObjectId;


var mongooseIterator = function (query, options) {
  var Model = this;

  function _iterator(qry, opts) {
    var self = this;
    // 1 is oldest to newest, -1 is newest to oldest
    self.SORT = {ASC: 1, DESC: -1};

    opts = opts || {};
    self.opts = {};
    self.opts.limit = opts.limit || 100;
    self.opts.sort = opts.sort || {_id: self.SORT.DESC};

    var base_date = (self.opts.sort._id === self.SORT.ASC) ? new Date(2000, 1, 1) : moment().add('y', 2);
    self.last_id = objectIdWithTimestamp(base_date);

    self.query = function (cb) {
      var args = qry;

      if (self.opts.sort._id === self.SORT.ASC) {
        _.extend(args, {
          _id: {$gt: self.last_id}
        });
      }
      else {
        _.extend(args, {
          _id: {$lt: self.last_id}
        });
      }

      Model.find(args)
        .limit(self.opts.limit)
        .sort(self.opts.sort)
        .lean()
        .exec(function iterate_results(err, results) {
          if (err) {
            console.trace(err);
            return cb(err);
          }
          if (results && results.length > 0) {
            self.last_id = results[results.length - 1]._id;
          }

          cb(null, results);
        });
    }

  }

  return new _iterator(query, options);

};


// This function returns an ObjectId embedded with a given datetime
// Accepts both Date object and string input
//http://stackoverflow.com/questions/8749971/can-i-query-mongodb-objectid-by-date
function objectIdWithTimestamp(timestamp)
{
  // Convert string date to Date object (otherwise assume timestamp is a date)
  if (typeof(timestamp) == 'string') {
    timestamp = new Date(timestamp);
  }

  // Convert date object to hex seconds since Unix epoch
  var hexSeconds = Math.floor(timestamp/1000).toString(16);

  // Create an ObjectId with that hex timestamp
  var constructedObjectId = ObjectId(hexSeconds + "0000000000000000");

  return constructedObjectId
}

mongoose.Model.getIterator = mongooseIterator;
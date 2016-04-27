
angular.module('queue', []).factory('Queue', ['$q', function($q) {
    function PromiseQueue(size, startPaused) {
        var self = this;
        var activeSet = [];
        var paused = !!startPaused;
        var waitingList = [];
        var observers = [];

        // register a new job in the waiting list.
        this.register = function(fn) {
            var deferred = $q.defer();
            deferred.function = fn;
            waitingList.push(deferred);

            doNext();

            return deferred.promise;
        };

        // register a list of jobs in the waiting list
        this.registerAll = function() {
            for (var i = 0; i < arguments.length; i++) {
                self.register(arguments[i]);
            }

            return this;
        };

        // returns a promise which succeeds when all the jobs in the queue are done
        this.awaitAll = function() {
            // if there are no jobs resolve the promise immediately
            if (activeSet.length == 0 && waitingList.length == 0) {
                return $q.when();
            }
            
            var observer = $q.defer();
            observers.push(observer);
            return observer.promise;
        };
        
        this.waitingListCount = function() {
            return waitingList.length;
        }

        // start processing the jobs in the queue
        this.start = function() {
            paused = false;
            doNext();
        };

        // pause the jobs in the queue (existing jobs will be allowed to finish)
        this.pause = function() {
            paused = true;
        };

        this.isPaused = function() {
            return paused;
        };

        // resolves all observers on this queue
        function allDone() {
            for (var i = 0; i < observers.length; i++) {
                observers[i].resolve(true);
            }
        }

        // executes the next job in the queue
        function doNext() {
            if (paused) return;
            if (activeSetFull()) return;
            if (waitingList.length == 0) {
                allDone();
                return;
            }

            var deferred = waitingList.shift();
            var promise = deferred.function();

            activeSet.push(promise);

            var resolutionFn = function(returnValue) {
                deferred.resolve(returnValue);
            };

            var rejectFn = function(error) {
                deferred.reject(error);
            };

            var taskCompleteFn = function() {
                removeFromActiveSet(promise);
                doNext();
            };

            promise
                .then(resolutionFn, rejectFn)
                .finally(taskCompleteFn);
        }

        // removes a job from the currently running jobs list
        function removeFromActiveSet(promise) {
            var index = activeSet.indexOf(promise);
            if (index > -1) {
                activeSet.splice(index, 1);
            }
        }

        // check if the currently running jobs list is full
        function activeSetFull() {
            return activeSet.length >= size;
        }
    }

    return {
        PromiseQueue:PromiseQueue
    }
}]);
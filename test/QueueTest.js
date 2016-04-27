describe("A PromiseQueue", function() {
    var PromiseQueue;

    var slowTask;
    var immediateTask;
    var countingTask;
    var unendingTask;
    var loggedTask;
    var failingTask;

    // dependencies
    var $rootScope;
    var $timeout;
    var $q;

    var taskCount;
    var immediateTaskResult = 1;

    function thenCall(promiseFn, thenFn) {
        return promiseFn().catch(function() {
            console.log("err");
        }).then(thenFn);
    }

    beforeEach(module('queue'));

    beforeEach(inject(function (_$rootScope_, $injector, _$timeout_, _$q_) {
        $rootScope = _$rootScope_;
        $q = _$q_;
        $timeout = _$timeout_;
        var service = $injector.get('Queue');
        PromiseQueue = service.PromiseQueue;

        slowTask = _.partial($timeout, _.constant("some result"), 400);
        immediateTask = _.partial($q.when, immediateTaskResult);

        taskCount = 0;
        countingTask = _.partial(thenCall, immediateTask, function() {
            taskCount++;
        });

        unendingTask = function() {
            return $q.defer().promise;
        };

        loggedTask = function(task, log) {
            var promise = task();
            log.push(promise);
            return promise;
        };

        failingTask = function() {
            var deferred = $q.defer();
            deferred.reject("this task failed");
            return deferred.promise;
        }
    }));

    it("should execute a task", function(done) {
        var task = _.partial(thenCall, slowTask, done);

        new PromiseQueue(1).register(task);

        $timeout.flush();
    });

    it("should execute tasks in serial", function(done) {
        var task1 = immediateTask;
        var task2 = _.partial(thenCall, immediateTask, done);

        new PromiseQueue(1)
            .registerAll(task1, task2);

        $rootScope.$digest();
    });

    it("should execute all the tasks in serial", function(done) {
        var queue = new PromiseQueue(1, true).registerAll(
            countingTask,
            countingTask,
            countingTask,
            countingTask,
            countingTask,
            countingTask
        );

        queue.awaitAll().then(function() {
            expect(taskCount).toEqual(6);
            done();
        });

        queue.start();

        $rootScope.$digest();
    });

    it("should execute all the tasks in parallel", function(done) {
        var queue = new PromiseQueue(10, true).registerAll(
            countingTask,
            countingTask,
            countingTask,
            countingTask,
            countingTask,
            countingTask
        );

        queue.awaitAll().then(function() {
            expect(taskCount).toEqual(6);
            done();
        });

        queue.start();

        $rootScope.$digest();
    });

    it("will not execute new tasks until old ones are complete", function() {
        var runningTasks = [];
        var loggedTaskFn = _.partial(loggedTask, unendingTask, runningTasks);

        // register two unending tasks in a queue that allows one at a time
        new PromiseQueue(1).registerAll(
            loggedTaskFn,
            loggedTaskFn
        );

        $rootScope.$digest();

        // only one task will be running
        expect(runningTasks.length).toEqual(1);
    });


    it("will execute as many tasks as the queue allows at once", function() {
        var runningTasks = [];
        var loggedTaskFn = _.partial(loggedTask, unendingTask, runningTasks);

        // register five unending tasks in a queue that allows three at once
        new PromiseQueue(3).registerAll(
            loggedTaskFn,
            loggedTaskFn,
            loggedTaskFn,
            loggedTaskFn,
            loggedTaskFn
        );

        $rootScope.$digest();

        // three tasks will be running
        expect(runningTasks.length).toEqual(3);
    });

    it("should not be stopped by failing tasks", function(done) {
        var queue = new PromiseQueue(1, true).registerAll(
            failingTask,
            countingTask,
            countingTask,
            countingTask,
            countingTask,
            countingTask
        );

        queue.awaitAll().then(function() {
            expect(taskCount).toEqual(5);
            done();
        });

        queue.start();

        $rootScope.$digest();
    });

    it("return a promise when registering a job, that resolves to the job value", function(done) {
        var promise = new PromiseQueue(1).register(immediateTask);

        promise.then(function(value) {
            expect(value).toEqual(immediateTaskResult);
            done()
        });
        $rootScope.$digest();
    });
});

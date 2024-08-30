/*
 * Touch Events JS package for Bear Framework
 * https://github.com/ivopetkov/touch-events-js-bearframework-addon
 * Copyright (c) Ivo Petkov
 * Free to use under the MIT license.
 */

/* global clientPackages */

var ivoPetkov = ivoPetkov || {};
ivoPetkov.bearFrameworkAddons = ivoPetkov.bearFrameworkAddons || {};
ivoPetkov.bearFrameworkAddons.touchEvents = ivoPetkov.bearFrameworkAddons.touchEvents || (function () {

    var makeEventTarget = () => {
        if (EventTarget !== undefined && EventTarget.constructor !== undefined) {
            try {
                return new EventTarget();
            } catch (e) {

            }
        }
        // Needed for iOS
        var listeners = [];
        return {
            addEventListener: (type, callback) => {
                if (!(type in listeners)) {
                    listeners[type] = [];
                }
                listeners[type].push(callback);
            },
            removeEventListener: (type, callback) => {
                if (!(type in listeners)) {
                    return;
                }
                var stack = listeners[type];
                for (var i = 0, l = stack.length; i < l; i++) {
                    if (stack[i] === callback) {
                        stack.splice(i, 1);
                        return;
                    }
                }
            },
            dispatchEvent: (event) => {
                if (!(event.type in listeners)) {
                    return true;
                }
                var stack = listeners[event.type].slice();
                for (var i = 0, l = stack.length; i < l; i++) {
                    stack[i].call(this, event);
                }
                return !event.defaultPrevented;
            }
        }
    };

    var isChildOf = function (parentElement, childElement) {
        if (childElement !== null && parentElement !== null) {
            var node = childElement.parentNode;
            while (node !== null) {
                if (node === parentElement) {
                    return true;
                }
                node = node.parentNode;
            }
        }
        return false;
    };

    var getEventsPointsDistance = function (event1, event2) {
        var event1X = event1.clientX;
        var event1Y = event1.clientY;
        var event2X = event2.clientX;
        var event2Y = event2.clientY;
        return Math.round(Math.sqrt(Math.pow(Math.abs(event2X - event1X), 2) + Math.pow(Math.abs(event2Y - event1Y), 2)));
    };

    var addZoom = function (element, container) {
        if (typeof container === 'undefined') {
            container = element;
        }

        container.addEventListener("touchstart", function (e) {
            if (element.contains(e.target)) {
                e.preventDefault();
            }
        }, { passive: false });

        var eventTarget = makeEventTarget();

        var pointers = [];

        var startDistance = null;
        var lastChange = 1;

        var start = function () {
            for (var i = 0; i < pointers.length; i++) { // for new starts after one finder was up
                var pointer = pointers[i];
                pointer.downEvent = pointer.moveEvent;
            }

            startDistance = getEventsPointsDistance(pointers[0].downEvent, pointers[1].downEvent);
            var event = new Event('start');
            eventTarget.dispatchEvent(event);
        };

        var end = function () {
            var event = new Event('end');
            event.change = lastChange;
            eventTarget.dispatchEvent(event);
        };

        var pointerDownHandler = function (e) {
            for (var i in pointers) {
                if (pointers[i].downEvent.pointerId === e.pointerId) {
                    return;
                }
            }
            pointers.push({
                downEvent: e,
                moveEvent: e
            });
            if (pointers.length === 2) {
                start();
            }
        };

        var pointerMoveHandler = function (e) {
            if (pointers.length === 2) {
                for (var i = 0; i < 2; i++) {
                    var pointer = pointers[i];
                    var downEvent = pointer.downEvent;
                    if (downEvent.pointerId === e.pointerId) {
                        pointer.moveEvent = e;
                    }
                }
                var currentDistance = getEventsPointsDistance(pointers[0].moveEvent, pointers[1].moveEvent);
                lastChange = currentDistance / startDistance;
                var event = new Event('change');
                event.change = lastChange;
                eventTarget.dispatchEvent(event);
            }
        };

        var pointerUpHandler = function (e) {
            for (var i in pointers) {
                var pointer = pointers[i];
                if (pointer.downEvent.pointerId === e.pointerId) {
                    pointers.splice(i, 1);
                    if (pointers.length === 1) {
                        end();
                    }
                }
            }
        };

        element.addEventListener('pointerdown', pointerDownHandler);
        container.addEventListener('pointermove', pointerMoveHandler);
        container.addEventListener('pointerup', pointerUpHandler);
        container.addEventListener('pointercancel', pointerUpHandler);
        container.addEventListener('pointerout', function (e) {
            if (isChildOf(container, e.target)) {
                return;
            }
            pointerUpHandler(e);
        });
        container.addEventListener('pointerleave', pointerUpHandler);

        return eventTarget;
    };

    var addMove = function (element, container) {
        if (typeof container === 'undefined') {
            container = element;
        }

        container.addEventListener("touchstart", function (e) {
            if (element.contains(e.target)) {
                e.preventDefault();
            }
        }, { passive: false });

        var eventTarget = makeEventTarget();

        var pointers = [];

        var startPosition = [0, 0];
        var lastChange = [0, 0];

        var getMovePointPosition = function (useDownEvent) {
            var pointersLength = pointers.length;
            if (pointersLength === 1) {
                var event = useDownEvent ? pointers[0].downEvent : pointers[0].moveEvent;
                return [event.clientX, event.clientY];
            } else if (pointersLength > 1) {
                var event1 = useDownEvent ? pointers[0].downEvent : pointers[0].moveEvent;
                var event2 = useDownEvent ? pointers[1].downEvent : pointers[1].moveEvent;
                return [event1.clientX - (event1.clientX - event2.clientX) / 2, event1.clientY - (event1.clientY - event2.clientY) / 2];
            }
            return [0, 0];
        };

        var start = function () {
            startPosition = getMovePointPosition(true);

            var event = new Event('start');
            eventTarget.dispatchEvent(event);
        };

        var end = function () {
            var event = new Event('end');
            event.changeX = lastChange[0];
            event.changeY = lastChange[1];
            eventTarget.dispatchEvent(event);

            lastChange = [0, 0];

            for (var i = 0; i < pointers.length; i++) {
                var pointer = pointers[i];
                pointer.downEvent = pointer.moveEvent;
            }
        };

        var pointerDownHandler = function (e) {
            for (var i in pointers) {
                if (pointers[i].downEvent.pointerId === e.pointerId) {
                    return;
                }
            }
            pointers.push({
                downEvent: e,
                moveEvent: e
            });
            if (pointers.length > 1) {
                end();
            }
            start();
        };

        var pointerMoveHandler = function (e) {
            for (var i = 0; i < pointers.length; i++) {
                var pointer = pointers[i];
                var downEvent = pointer.downEvent;
                if (downEvent.pointerId === e.pointerId) {
                    pointer.moveEvent = e;
                }
            }
            if (pointers.length === 0) {
                return;
            }
            var movePosition = getMovePointPosition(false);
            lastChange = [Math.round(movePosition[0] - startPosition[0]), Math.round(movePosition[1] - startPosition[1])];
            var event = new Event('change');
            event.changeX = lastChange[0];
            event.changeY = lastChange[1];
            eventTarget.dispatchEvent(event);
        };

        var pointerUpHandler = function (e) {
            for (var i in pointers) {
                var pointer = pointers[i];
                if (pointer.downEvent.pointerId === e.pointerId) {
                    pointers.splice(i, 1);
                    end();
                    if (pointers.length > 0) {
                        start();
                    }
                }
            }
        };

        element.addEventListener('pointerdown', pointerDownHandler);
        container.addEventListener('pointermove', pointerMoveHandler);
        container.addEventListener('pointerup', pointerUpHandler);
        container.addEventListener('pointercancel', pointerUpHandler);
        container.addEventListener('pointerout', function (e) {
            if (isChildOf(container, e.target)) {
                return;
            }
            pointerUpHandler(e);
        });
        container.addEventListener('pointerleave', pointerUpHandler);

        return eventTarget;
    };

    var addDoubleTap = function (element) {
        var eventTarget = makeEventTarget();

        var pointers = [];
        var lastEvents = [];

        var pointerDownHandler = function (e) {
            for (var i in pointers) {
                if (pointers[i].pointerId === e.pointerId) {
                    return;
                }
            }
            pointers.push(e);
            if (pointers.length === 1) {
                lastEvents.push([0, (new Date()).getTime()]); // down + date
            }
        };

        var pointerUpHandler = function (e) {
            for (var i in pointers) {
                var pointer = pointers[i];
                if (pointer.pointerId === e.pointerId) {
                    pointers.splice(i, 1);
                    if (pointers.length === 0) {
                        lastEvents.push([1, (new Date()).getTime()]);
                        var startIndex = lastEvents.length - 4;
                        if (startIndex < 0) {
                            startIndex = 0;
                        }
                        lastEvents = lastEvents.slice(startIndex);
                        if (lastEvents.length === 4) {
                            var eventsSum = 0; // expect: 1*0 + 2*1 + 3*0 + 4*1 === 6
                            for (var j = 1; j <= lastEvents.length; j++) {
                                eventsSum += j * lastEvents[j - 1][0];
                            }
                            if (eventsSum === 6 && lastEvents[3][1] - lastEvents[0][1] < 500) { // check sum and time between the last and the first event
                                var event = new Event('done');
                                eventTarget.dispatchEvent(event);
                            };
                        }
                    }
                }
            }
        };

        element.addEventListener('pointerdown', pointerDownHandler);
        element.addEventListener('pointerup', pointerUpHandler);

        return eventTarget;
    };

    var addSwipe = function (element, container) {
        if (typeof container === 'undefined') {
            container = element;
        }

        container.addEventListener("touchstart", function (e) {
            if (element.contains(e.target)) {
                e.preventDefault();
            }
        }, { passive: false });

        var eventTarget = makeEventTarget();

        var pointers = []; // will be only one

        var lastChange = [0, 0, null];

        var startEventDispatched = null;

        var pointerDownHandler = function (e) {
            if (pointers.length === 1) {
                return;
            }
            for (var i in pointers) {
                if (pointers[i].downEvent.pointerId === e.pointerId) {
                    return;
                }
            }
            pointers.push({
                downEvent: e,
                moveEvent: e
            });
            startEventDispatched = false;
        };

        var pointerMoveHandler = function (e) {
            for (var i = 0; i < pointers.length; i++) {
                var pointer = pointers[i];
                var downEvent = pointer.downEvent;
                if (downEvent.pointerId === e.pointerId) {
                    pointer.moveEvent = e;
                }
            }
            if (pointers.length === 0) {
                return;
            }
            if (startEventDispatched === false) {
                var event = new Event('start');
                eventTarget.dispatchEvent(event);
                startEventDispatched = true;
            }
            var pointer1 = pointers[0];
            var changeX = pointer1.moveEvent.clientX - pointer1.downEvent.clientX;
            var changeY = pointer1.moveEvent.clientY - pointer1.downEvent.clientY;
            var direction = null;
            if (Math.abs(changeX) > Math.abs(changeY)) {
                direction = changeX < 0 ? 'left' : 'right';
            } else {
                direction = changeY < 0 ? 'up' : 'down';
            }
            var event = new Event('change');
            event.changeX = changeX;
            event.changeY = changeY;
            event.direction = direction;
            eventTarget.dispatchEvent(event);
            lastChange = [changeX, changeY, direction];
        };

        var pointerUpHandler = function (e) {
            for (var i in pointers) {
                var pointer = pointers[i];
                if (pointer.downEvent.pointerId === e.pointerId) {
                    pointers.splice(i, 1);
                    var event = new Event('end');
                    event.changeX = lastChange[0];
                    event.changeY = lastChange[1];
                    event.direction = lastChange[2];
                    eventTarget.dispatchEvent(event);
                    lastChange = [0, 0, null];
                    startEventDispatched = null;
                }
            }
        };

        element.addEventListener('pointerdown', pointerDownHandler);
        container.addEventListener('pointermove', pointerMoveHandler);
        container.addEventListener('pointerup', pointerUpHandler);
        container.addEventListener('pointercancel', pointerUpHandler);
        container.addEventListener('pointerout', function (e) {
            if (isChildOf(container, e.target)) {
                return;
            }
            pointerUpHandler(e);
        });
        container.addEventListener('pointerleave', pointerUpHandler);

        return eventTarget;
    };

    return {
        addZoom: addZoom,
        addMove: addMove,
        addDoubleTap: addDoubleTap,
        addSwipe: addSwipe
    }

}());
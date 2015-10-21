var slidingTabsDirective = angular.module("ionic").directive('ionSlideTabs', [
    '$timeout', '$compile', '$interval', '$ionicSlideBoxDelegate', '$ionicScrollDelegate', '$ionicGesture', '$q', 'ionSlideBoxService',
    function($timeout, $compile, $interval, $ionicSlideBoxDelegate, $ionicScrollDelegate, $ionicGesture, $q, ionSlideBoxService) {
    return {
        require: "^ionSlideBox",
        restrict: 'A',
        link: function(scope, element, attrs, parent) {

            var ionicSlideBoxDelegate;
            var ionicScrollDelegate;
            var ionicScrollDelegateID;

            var slideTabs;
            var indicator;

            var slider;
            var tabsBar;

            var slideDirection;
            var currentSlideIndex;
            var targetSlideIndex;

            var disabledSlideBox;

            var options = {
                "slideTabsScrollable": true
            };

            var init = function () {
console.log('init called')

                if (angular.isDefined( attrs.slideTabsScrollable ) && attrs.slideTabsScrollable === "false" ) {
                    options.slideTabsScrollable = false;
                }

                var tabItems = '<li ng-repeat="(key, value) in tabs" ng-click="onTabTabbed($event, {{key}})" class="slider-slide-tab" ng-bind-html="value"></li>';

                if (options.slideTabsScrollable) {

                    ionicScrollDelegateID = "ion-slide-tabs-handle-" + Math.floor((Math.random() * 10000) + 1);
                    tabsBar = angular.element('<ion-scroll delegate-handle="' + ionicScrollDelegateID + '" class="slidingTabs" direction="x" scrollbar-x="false"><ul>' + tabItems + '</ul> <div class="tab-indicator-wrapper"><div class="tab-indicator"></div></div> </ion-scroll>');

                } else {

                    tabsBar = angular.element('<div class="slidingTabs"><ul>' + tabItems + '</ul> <div class="tab-indicator-wrapper"><div class="tab-indicator"></div></div> </div>');

                }


                slider = angular.element(element);

                var compiled = $compile(tabsBar);
                slider.parent().prepend(tabsBar);
                compiled(scope);

                //get Tabs DOM Elements
                indicator = angular.element(tabsBar[0].querySelector(".tab-indicator"));

                //get the slideBoxHandle
                var slideHandle = slider.attr('delegate-handle');
                var scrollHandle = tabsBar.attr('delegate-handle');

                ionicSlideBoxDelegate = $ionicSlideBoxDelegate;
                if (slideHandle) {
                    ionicSlideBoxDelegate = ionicSlideBoxDelegate.$getByHandle(slideHandle);
                }


                if (options.slideTabsScrollable) {

                    ionicScrollDelegate = $ionicScrollDelegate;
                    if (scrollHandle) {
                        ionicScrollDelegate = ionicScrollDelegate.$getByHandle(scrollHandle);
                    }

                }


                addEvents();
                setTabBarWidth();
                slideToCurrentPosition();

                // set it in the service
                ionSlideBoxService.set(element[0].getAttribute('delegate-handle'),
                    element[0]);
            };

            var addEvents = function () {
                ionic.onGesture("dragleft", scope.onSlideMove, slider[0]);
                ionic.onGesture("dragright", scope.onSlideMove, slider[0]);
                ionic.onGesture("release",  scope.onSlideChange, slider[0]);

            };

            var setTabBarWidth = function () {

                if( !angular.isDefined(slideTabs) || slideTabs.length == 0 ) {
                    return false;
                }

                tabsList = tabsBar.find("ul");
                var tabsWidth = 0;

                angular.forEach(slideTabs, function (currentElement,index) {

                    var currentLi = angular.element(currentElement);
                    tabsWidth += currentLi[0].offsetWidth;
                });

                if (options.slideTabsScrollable) {

                    angular.element(tabsBar[0].querySelector(".scroll")).css("width", tabsWidth + 1 + "px");

                } else {

                    slideTabs.css("width",tabsList[0].offsetWidth / slideTabs.length + "px");
                }


                slideToCurrentPosition();

                // call update to reset the slidebox sizing
                ionicSlideBoxDelegate.update();
            };

            var addTabTouchAnimation = function (event,currentElement) {

                var ink = angular.element(currentElement[0].querySelector(".ink"));

                if ( !angular.isDefined(ink) || ink.length == 0 ) {
                    ink = angular.element("<span class='ink'></span>");
                    currentElement.prepend(ink);
                }


                ink.removeClass("animate");

                if (!ink.offsetHeight && !ink.offsetWidth) {

                    d = Math.max(currentElement[0].offsetWidth, currentElement[0].offsetHeight);
                    ink.css("height", d + "px");
                    ink.css("width", d + "px");
                }

                x = event.offsetX - ink[0].offsetWidth / 2;
                y = event.offsetY - ink[0].offsetHeight / 2;


                ink.css("top", y +'px');
                ink.css("left", x +'px');
                ink.addClass("animate");
            };

            var slideToCurrentPosition = function () {

                if( !angular.isDefined(slideTabs) || slideTabs.length == 0 ) {
                    return false;
                }

                var targetSlideIndex = ionicSlideBoxDelegate.currentIndex();

                var targetTab = angular.element(slideTabs[targetSlideIndex]);
                var targetLeftOffset = targetTab.prop("offsetLeft");
                var targetWidth = targetTab[0].offsetWidth;



                indicator.css({
                    "-webkit-transition-duration": "300ms",
                    "-webkit-transform":"translate(" + targetLeftOffset + "px,0px)",
                    "width": targetWidth + "px"
                });

                if (options.slideTabsScrollable && ionicScrollDelegate) {
                    var scrollOffset = 40;
                    ionicScrollDelegate.scrollTo(targetLeftOffset - scrollOffset,0,true);
                }

                slideTabs.removeClass("tab-active");
                targetTab.addClass("tab-active");

            };


            var setIndicatorPosition = function (currentSlideIndex, targetSlideIndex, position, slideDirection) {

                var targetTab = angular.element(slideTabs[targetSlideIndex]);

                var currentTab = angular.element(slideTabs[currentSlideIndex]);
                var targetLeftOffset = targetTab.prop("offsetLeft");

                var currentLeftOffset = currentTab.prop("offsetLeft");
                var offsetLeftDiff = Math.abs(targetLeftOffset - currentLeftOffset);


                if( currentSlideIndex == 0 && targetSlideIndex == ionicSlideBoxDelegate.slidesCount() - 1 && slideDirection == "right" ||
                    targetSlideIndex == 0 && currentSlideIndex == ionicSlideBoxDelegate.slidesCount() - 1 && slideDirection == "left" ) {
                    return;
                }

                var targetWidth = targetTab[0].offsetWidth;
                var currentWidth = currentTab[0].offsetWidth;
                var widthDiff = targetWidth - currentWidth;

                var indicatorPos = 0;
                var indicatorWidth = 0;

                if (currentSlideIndex > targetSlideIndex) {

                    indicatorPos = targetLeftOffset - (offsetLeftDiff * (position - 1));
                    indicatorWidth = targetWidth - ((widthDiff * (1 - position)));

                } else if (targetSlideIndex > currentSlideIndex) {

                    indicatorPos = targetLeftOffset + (offsetLeftDiff * (position - 1));
                    indicatorWidth = targetWidth + ((widthDiff * (position - 1)));

                }


                indicator.css({
                    "-webkit-transition-duration":"0ms",
                    "-webkit-transform":"translate(" + indicatorPos + "px,0px)",
                    "width": indicatorWidth + "px"
                });


                if (options.slideTabsScrollable && ionicScrollDelegate) {
                    var scrollOffset = 40;
                    ionicScrollDelegate.scrollTo(indicatorPos - scrollOffset,0,false);
                }

            };
/*
            var setLockStatus = function (event) {
                var slide = event.srcElement;

                //console.log(slide)

                var delegateHandle  = false,
                    slides          = [],
                    parent          = slide.parentNode,
                    slideBox        = [],
                    parentSlideBox  = false;

                // search for all ion-slide-box parents
                slideBox = document.querySelectorAll('.slider.disable-user-behavior');
                //console.log(slideBox)
//                while (parent) {
//                    if (parent.getAttribute &&
//                        parent.getAttribute('delegate-handle')) {
//                        slideBox[slideBox.length] = parent;
//                    }
//
//                    parent = parent.parentNode;
//                }

                // build slides
                if (slideBox.length > 1) {
                    parentSlideBox = slideBox[1];
                    slides = parentSlideBox.getElementsByClassName('slider-slide');
                } else {
                    parentSlideBox = slideBox[0];
                    slides = parentSlideBox.getElementsByClassName('slider-slide');
                }

                // check if the parent is a sibling of another slidebox
                parent = parentSlideBox.parentNode;
                while(parent) {
                    if (parent.getAttribute &&
                        parent.getAttribute('delegate-handle')) {
                        var isInnerSlideBox = true;
                        parent = false;
                    } else {
                        parent = parent.parentNode;
                    }
                }

                // set the current slide using the first parent
                currentSlideIndex = ionicSlideBoxDelegate.currentIndex();
                // get the current slide
                currentSlide = slides[currentSlideIndex];
                // figure out the left-most area of the current slide
                var currentSlideLeftOffset = angular.element(currentSlide).css('-webkit-transform').replace(/[^0-9\-.,]/g, '').split(',')[0];

                // figure out the target slide
                targetSlideIndex = (currentSlideIndex + 1);
console.log('currentSlideLeftOffset:'+currentSlideLeftOffset)
console.log('slider.prop(offsetLeft):'+slider.prop('offsetLeft'))
console.log('currentSlideLeftOffset:' + event.srcElement.offsetLeft);
                if (currentSlideLeftOffset < slider.prop("offsetLeft")) {
                    targetSlideIndex = currentSlideIndex - 1;
                }

                console.log('currentSlideIndex:'+currentSlideIndex)
                console.log('slideBox.length:'+slideBox.length)
                console.log('slides.length:'+slides.length)
                console.log('targetSlideIndex:'+targetSlideIndex)
                console.log('isInnerSlideBox:'+isInnerSlideBox)
                console.log(parentSlideBox)

                // if the currentSlide is the first or last slide, and there is an outer
                // parent, reset scrolling on it
                if  ( slideBox.length > 1 &&
                    ( currentSlideIndex === 0 && targetSlideIndex === -1) ||
                    ( currentSlideIndex === slides.length - 1 &&
                        targetSlideIndex === slides.length)) {

                    $timeout(function () {
console.log('reenabling:' + slideBox[0].getAttribute('delegate-handle'));
                        $ionicSlideBoxDelegate.$getByHandle(slideBox[0].getAttribute('delegate-handle')).enableSlide(true);
                    });
                    event.stopPropagation();
                    return;
                }

                // if there's more than 1 slide box, shut down scrolling on the outer parent
                // and stop event from propagating up
                if (slideBox.length > 1 &&
                    isInnerSlideBox) {
                    $timeout(function () {
console.log('disabling:'+slideBox[0].getAttribute('delegate-handle'))
                        $ionicSlideBoxDelegate.$getByHandle(slideBox[0].getAttribute('delegate-handle')).enableSlide(false);
                    });

                    return event.stopPropagation();
                }

            };
*/

            var lockParent = null;

            var setLockStatus = function (currentSlide, event) {
                if (lockParent !== null) {
                    $timeout.cancel(lockParent);
                }

                lockParent = $timeout(function () {
                    var slide = currentSlide[0],
                        parentBox = slide.parentElement.parentElement,
                        outerSlideBox = null;

                    if (parentBox.parentElement.parentElement.className.indexOf('slider') > -1) {
                        outerSlideBox = parentBox.parentElement.parentElement.parentElement;
                    }


                    var direction = (event.type === 'dragright') ? 'right' : 'left';


    //console.log('currentSlide:'+currentSlide);
    console.log('direction:'+direction);
    console.log('parentBox disabled:'+$ionicSlideBoxDelegate.$getByHandle(parentBox.getAttribute('delegate-handle'))._instances[1].slideIsDisabled)
    console.log('outerSlideBox disabled:'+$ionicSlideBoxDelegate.$getByHandle(outerSlideBox.getAttribute('delegate-handle'))._instances[0].slideIsDisabled)

                    // if there is an outer slidebox
                    if (outerSlideBox !== null) {

                        var sibling = (direction === 'left') ? 'nextElementSibling' : 'previousElementSibling';
                        var handle = outerSlideBox.getAttribute('delegate-handle');

                        var slideIsChildOfOuter = (slide.parentElement.parentElement === outerSlideBox);

                        if (slideIsChildOfOuter) {
                            return $ionicSlideBoxDelegate.$getByHandle(handle).enableSlide(true);
                        }

    console.log('outerSlideBox:' + outerSlideBox.getAttribute('delegate-handle'))
    console.log('parentBox:' + parentBox.getAttribute('delegate-handle'))
    console.log('sibling:'+sibling)
    console.log('handle:'+handle)
    console.log(sibling+'===null:'+(slide[sibling] === null))

                        $ionicSlideBoxDelegate.$getByHandle(handle).enableSlide(slide[sibling] === null);

                    }

                }, 10);
            };

            scope.onTabTabbed = function(event, index) {
                addTabTouchAnimation(event, angular.element(event.currentTarget) );
                ionicSlideBoxDelegate.slide(index);
                slideToCurrentPosition();
            }

            scope.tabs = [];

            scope.addTabContent = function ($content) {

                scope.tabs.push($content);
                scope.$apply();

                $timeout(function() {
                    slideTabs = angular.element(tabsBar[0].querySelector("ul").querySelectorAll(".slider-slide-tab"));
                    slideToCurrentPosition();
                    setTabBarWidth()
                });

            };

            scope.onSlideChange = function (event) {

                slideToCurrentPosition();

                // set the lock status of the sliding tabs
                setLockStatus(angular.element(event.srcElement), event);
            };

            scope.onSlideMove = function (event) {
                var scrollDiv = slider[0].getElementsByClassName("slider-slide");

                var currentSlideIndex = ionicSlideBoxDelegate.currentIndex();
                var currentSlide = angular.element(event.srcElement); //angular.element(scrollDiv[currentSlideIndex]);
                var currentSlideLeftOffset = currentSlide.css('-webkit-transform').replace(/[^0-9\-.,]/g, '').split(',')[0];

                var targetSlideIndex = (currentSlideIndex + 1) % scrollDiv.length;
                if (currentSlideLeftOffset > slider.prop("offsetLeft")) {
                    targetSlideIndex = currentSlideIndex - 1;
                    if (targetSlideIndex < 0) {
                        targetSlideIndex = scrollDiv.length - 1;
                    }
                }
                var targetSlide = angular.element(scrollDiv[targetSlideIndex]);

                var position = currentSlideLeftOffset / slider[0].offsetWidth;
                var slideDirection = position > 0 ? "right":"left";
                position = Math.abs(position);

                // determine lock status for slidebox
                setLockStatus(currentSlide, event);

                setIndicatorPosition(currentSlideIndex, targetSlideIndex, position, slideDirection);
            };

            init();
        },
        controller: ['$scope',function($scope) {
            this.addTab = function($content) {
                $timeout(function() {
                    if($scope.addTabContent) {
                        $scope.addTabContent($content);
                    }
                });
            }
        }]
    };
}]);

slidingTabsDirective.directive('ionSlideTabLabel', [ function() {
    return {
        require: "^ionSlideTabs",
        link: function ($scope, $element, $attrs, $parent) {
            $parent.addTab($attrs.ionSlideTabLabel);
        }
    }
}]);

slidingTabsDirective.factory('ionSlideBoxService', [function () {
    var slideBoxService = {};

    var slideBoxes = {};

    slideBoxService.set = function (name, slideBoxElement) {
        slideBoxes[name] = slideBoxElement;
        return slideBoxes;
    };

    slideBoxService.get = function (name) {
        return slideBoxes[name];
    };

    slideBoxService.findBoxForSlide = function (slide) {
console.log('ionSlideBoxService:')
console.log('slide:'+slide)
        angular.forEach(slideBoxes, function (name) {
            slideBoxes[name].querySelector('')
        });
    };

    return slideBoxService;
}]);
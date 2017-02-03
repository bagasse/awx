export default
    ['templateUrl', '$state', 'FeaturesService', 'ProcessErrors','$rootScope', 'Store', 'Empty', '$window', 'BreadCrumbService', 'i18n',
    function(templateUrl, $state, FeaturesService, ProcessErrors, $rootScope, Store, Empty, $window, BreadCrumbService, i18n) {
        return {
            restrict: 'E',
            templateUrl: templateUrl('bread-crumb/bread-crumb'),
            link: function(scope) {

                var streamConfig = {}, originalRoute;

                function init() {

                    scope.showActivityStreamButton = false;
                    scope.showRefreshButton = false;
                    scope.loadingLicense = true;

                    function onResize(){
                        BreadCrumbService.truncateCrumbs();
                    }

                    function cleanUp() {
                        angular.element($window).off('resize', onResize);
                    }

                    angular.element($window).on('resize', onResize);
                    scope.$on('$destroy', cleanUp);
                }

                init();

                scope.refresh = function() {
                    $state.go($state.current, {}, {reload: true});
                };

                scope.toggleActivityStream = function() {

                        // If the user is not already on the activity stream then they want to navigate to it
                        if(!scope.activityStreamActive) {
                            var stateGoParams = {};

                            if(streamConfig && streamConfig.activityStream) {
                                if(streamConfig.activityStreamTarget) {
                                    stateGoParams.target = streamConfig.activityStreamTarget;
                                    let isTemplateTarget = _.contains(['template', 'job_template', 'workflow_job_template'], streamConfig.activityStreamTarget);
                                    stateGoParams.activity_search = {
                                        or__object1__in: isTemplateTarget ? 'job_template,workflow_job_template' : streamConfig.activityStreamTarget,
                                        or__object2__in: isTemplateTarget ? 'job_template,workflow_job_template' : streamConfig.activityStreamTarget,
                                        order_by: '-timestamp',
                                        page_size: '20',
                                    };
                                    if (streamConfig.activityStreamTarget && streamConfig.activityStreamId) {
                                        stateGoParams.activity_search[streamConfig.activityStreamTarget] = $state.params[streamConfig.activityStreamId];
                                    }
                                }
                                else {
                                    stateGoParams.activity_search = {
                                        order_by: '-timestamp',
                                        page_size: '20',
                                    };
                                }
                                if(streamConfig.activityStreamId) {
                                    stateGoParams.id = $state.params[streamConfig.activityStreamId];
                                }
                                if(stateGoParams.target === "custom_inventory_script"){
                                    stateGoParams.activity_search[streamConfig.activityStreamTarget] = $state.params.inventory_script_id;
                                    stateGoParams.id = $state.params.inventory_script_id;
                                }

                            }
                            originalRoute = $state.current;
                            $state.go('activityStream', stateGoParams);
                        }
                        // The user is navigating away from the activity stream - take them back from whence they came
                        else {
                            if(originalRoute) {
                                $state.go(originalRoute.name, originalRoute.fromParams);
                            }
                            else {
                                // If for some reason something went wrong (like local storage was wiped, etc) take the
                                // user back to the dashboard
                                $state.go('dashboard');
                            }

                        }

                    };

                scope.$on("$stateChangeStart", function updateActivityStreamButton(event, toState, toParams, fromState, fromParams) {
                    if(fromState && !Empty(fromState.name)) {
                        // Go ahead and attach the from params to the state object so that it can all be stored together
                        fromState.fromParams = fromParams ? fromParams : {};

                        // Store the state that we're coming from in local storage to be accessed when navigating away from the
                        // activity stream
                        //Store('previous_state', fromState);
                    }

                    streamConfig = (toState && toState.data) ? toState.data : {};

                    if(streamConfig && streamConfig.activityStream) {

                        // Check to see if activity_streams is an enabled feature.  $stateChangeSuccess fires
                        // after the resolve on the state declaration so features should be available at this
                        // point.  We use the get() function call here just in case the features aren't available.
                        // The get() function will only fire off the server call if the features aren't already
                        // attached to the $rootScope.
                        var features = FeaturesService.get();
                        if(features){
                            scope.loadingLicense = false;
                            scope.activityStreamActive = (toState.name === 'activityStream') ? true : false;
                            scope.activityStreamTooltip = (toState.name === 'activityStream') ? i18n._('Hide Activity Stream') : i18n._('View Activity Stream');
                            scope.showActivityStreamButton = (FeaturesService.featureEnabled('activity_streams') || toState.name ==='activityStream') ? true : false;
                        }
                    }
                    else {

                        scope.showActivityStreamButton = false;

                    }

                    scope.showRefreshButton = (streamConfig && streamConfig.refreshButton) ? true : false;
                });

                // scope.$on('featuresLoaded', function(){
                $rootScope.featuresConfigured.promise.then(function(features){
                    // var features = FeaturesService.get();
                    if(features){
                        scope.loadingLicense = false;
                        scope.activityStreamActive = ($state.current.name === 'activityStream') ? true : false;
                        scope.activityStreamTooltip = ($state.current.name === 'activityStream') ? 'Hide Activity Stream' : 'View Activity Stream';
                        scope.showActivityStreamButton = (FeaturesService.featureEnabled('activity_streams') || $state.current.name ==='activityStream') ? true : false;
                    }
                });
            }
        };
    }];

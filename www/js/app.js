// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('conFusion', ['ionic', 'ngCordova', 'conFusion.controllers','conFusion.services'])

.run(function($ionicPlatform, $rootScope, $ionicLoading, $cordovaSplashscreen, $timeout) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
      // Commented this function out since it did not work in the emulator.
        // Also preferences in config.xml
//        $timeout(function(){
//            $cordovaSplashscreen.hide();
//        },2000);
  });
    
    $rootScope.$on('loading:show', function () {
        $ionicLoading.show({
            template: '<ion-spinner></ion-spinner> Loading ...'
        })
    });

    $rootScope.$on('loading:hide', function () {
        $ionicLoading.hide();
    });

    $rootScope.$on('$stateChangeStart', function () {
        console.log('Loading ...');
        $rootScope.$broadcast('loading:show');
    });

    $rootScope.$on('$stateChangeSuccess', function () {
        console.log('done');
        $rootScope.$broadcast('loading:hide');
    });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/sidebar.html',
    controller: 'AppCtrl'
  })

  .state('app.home', {
    url: '/home',
    views: {
      'mainContent': {
        templateUrl: 'templates/home.html',
        controller: 'ToDoListController'
      }
    }
  })
  
  // route for the todo list entry detail page
  .state('app.listdetail', {
	url: 'listdetail/:id',
	views: {
	  'mainContent': {
		templateUrl: 'templates/listdetail.html',
		controller:'ToDoListDetailController'   
	  }		
	}
  })
		
  // route for creating a new todo list entry
  .state('app.listcreate', {
	url: 'listcreate',
	views: {
	  'mainContent': {
		templateUrl: 'templates/listdetail.html',
		controller:'ToDoListCreationController'   
	  }
	}
  })
  
  .state('app.listtodoitems', {
	url: '/listtodoitems/:id',
	views: {
	  'mainContent': {
		templateUrl: 'templates/listtodoitems.html',
		controller:'ToDoItemListController'   
	  }
	}
  })
  
  // route for showing/editing the details of a todo item
  .state('app.todoitemdetail', {
    url: '/todoitemdetail/:id',
    views: {
      'mainContent': {
        templateUrl: 'templates/todoitemdetail.html',
        controller: 'ToDoItemDetailController'
      }
    }
  })
  
  // route for creating a new todo item entry for the given list
  .state('app.todoitemcreate', {
	url: 'todoitemcreate/:id',
	views: {
	  'mainContent': {
	    templateUrl : 'templates/todoitemdetail.html',
		controller  : 'ToDoItemCreationController'
	  }
	}
  }) 
  
  ;
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});

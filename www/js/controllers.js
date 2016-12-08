angular.module('conFusion.controllers', [])

.controller('AppCtrl', function ($scope, $rootScope, $state, $ionicModal, $timeout, $localStorage, $ionicPlatform, AuthFactory) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    // Form data for the login modal
    $scope.loginData = $localStorage.getObject('userinfo','{}');
    $scope.registration = {};
    $scope.loggedIn = false;
    
    if(AuthFactory.isAuthenticated()) {
        $scope.loggedIn = true;
        $scope.username = AuthFactory.getUsername();
    }
    
    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
        $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function () {
        $scope.modal.show();
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function () {
        console.log('Doing login', $scope.loginData);
        $localStorage.storeObject('userinfo',$scope.loginData);

        AuthFactory.login($scope.loginData);

        $scope.closeLogin();
    };
    
    $scope.logOut = function() {
       AuthFactory.logout();
        $scope.loggedIn = false;
        $scope.username = '';
    };
      
    $rootScope.$on('login:Successful', function () {
        $scope.loggedIn = AuthFactory.isAuthenticated();
        $scope.username = AuthFactory.getUsername();
		
		// After Login goto home page.
		$state.go('app.home', {}, {reload:true});
    });
   
    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/register.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.registerform = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeRegister = function () {
        $scope.registerform.hide();
    };

    // Open the login modal
    $scope.register = function () {
        $scope.registerform.show();
    };

    // Perform the login action when the user submits the login form
    $scope.doRegister = function () {
        console.log('Doing registration', $scope.registration);
        $scope.loginData.username = $scope.registration.username;
        $scope.loginData.password = $scope.registration.password;

        AuthFactory.register($scope.registration);
        // Simulate a login delay. Remove this and replace with your login
        // code if using a login system
        $timeout(function () {
            $scope.closeRegister();
        }, 1000);
    };
       
    $rootScope.$on('registration:Successful', function () {
        $scope.loggedIn = AuthFactory.isAuthenticated();
        $scope.username = AuthFactory.getUsername();
        $localStorage.storeObject('userinfo',$scope.loginData);
    });
})

// Controller for managing todo lists
.controller('ToDoListController', ['$scope', '$state', 'listFactory', function ($scope, $state, listFactory) {
	
	$scope.showLists = false;
	$scope.message = "Loading ...";
	
	$scope.lists = [];
	
	listFactory.query(
        function (response) {
            var resultList = response;  
			
			var len = resultList.length;	
			for (var i = 0; i < len; i++) {
				var resultEntry = resultList[i];
				var newEntry = {
					"_id":  resultEntry._id,
					"virtual": resultEntry.virtual,
					"name": resultEntry.name,
					"description": resultEntry.description,
					"itemsDue": resultEntry.dueItems					
				}
				$scope.lists.push(newEntry);	
			}			
			$scope.showLists = true;
        },
        function (error) {
            $scope.message = "Error: " + error.status + " " + error.statusText;
        }); 
	
	$scope.addNewTodoList = function() {
		console.log('Add a new todo list...');	
		$state.go('app.listcreate', {}, {});
	}
}])

// Controller for detail page of a specific Todo list entry
.controller('ToDoListDetailController', ['$scope', '$state', '$stateParams', 'listFactory', function ($scope, $state, $stateParams, listFactory) {

  	$scope.listEntry = {};
    $scope.showListEntry = false;
    $scope.message = "Loading ...";
	
	$scope.isNew = function () {
        return false;
    };
	
    $scope.listEntry = listFactory.get({
            id: $stateParams.id
        })
        .$promise.then(
            function (response) {
                $scope.listEntry = response;
                $scope.showListEntry = true;
            },
            function (response) {
                $scope.message = "Error reading listdata: " + response.status + " " + response.statusText;
            }
        );  
	
	$scope.cancelListEntryDetail = function () {
		$state.go('app.home', {}, {reload: true});	
	}
	
	$scope.submitListEntryDetail = function () {
  		listFactory.update({id: $stateParams.id}, $scope.listEntry,
			function(response) {
				console.log("Saved list entry with data: " + JSON.stringify(response));				
			}, 
			function(response) {
				console.log("Error saving list entry data: " + response.status + " " + response.statusText);
			}				 
		);
		
		$state.go('app.home', {}, {reload: true});			
    }
}])

// Controller for creating a new Todo list entry
.controller('ToDoListCreationController', ['$scope', '$state', 'listFactory', function ($scope, $state, listFactory) {
	
	$scope.listEntry = {
		name: "",
		description: ""
	};
	
	$scope.isNew = function () {
        return true;
    };
	
	$scope.cancelListEntryDetail = function () {
		$state.go('app.home', {}, {reload: true});	
	}
	
	$scope.submitListEntryDetail = function () {
  		listFactory.save($scope.listEntry,
			function(response) {
				console.log("Saved list entry with data: " + JSON.stringify(response));				
			}, 
			function(response) {
				console.log("Error saving list entry data: " + response.status + " " + response.statusText);
			}				 
		);
		
		$state.go('app.home', {}, {reload: true});			
    }
}])

// Controller for managing todo items of a Todo list.
.controller('ToDoItemListController', ['$scope', '$state', '$stateParams', '$ionicListDelegate', '$ionicPopup', '$ionicLoading', '$timeout', '$ionicPlatform', '$ionicPopover', 'listTodoItemsFactory', 'listFactory', 'todoItemsFactory', function ($scope, $state, $stateParams, $ionicListDelegate, $ionicPopup, $ionicLoading, $timeout, $ionicPlatform, $ionicPopover, listTodoItemsFactory, listFactory, todoItemsFactory) {
	
	$scope.listEntry = {};
    $scope.showListEntry = false;
	
	// Load Todo List data
    $scope.listEntry = listFactory.get({
            id: $stateParams.id
		})
		.$promise.then(
			function (response) {
				$scope.listEntry = response;
				$scope.showListEntry = true;
			},
			function (response) {
				$scope.message = "Error reading listdata: " + response.status + " " + response.statusText;
			}
		); 
	
	$scope.showItems = false;
	$scope.message = "Loading ...";
	
	// Load all Todo items of the List
	$scope.todoItems = [];
	listTodoItemsFactory.get({
			id: $stateParams.id
		})
		.$promise.then(
			function (response) {
				$scope.todoItems = response;
				$scope.showItems = true;
			},
			function (response) {
				$scope.message = "Error reading items of list: " + response.status + " " + response.statusText;
			}
		);
	
	$scope.showDoneItems = false; // false = done items are hidden; true = done items are shown
	$scope.buttonTitle = 'Show done items';
	
	// List detail is not editable for virtual lists like daily, weekly.
	$scope.editListDetailsAllowed = function(listEntry) {
        if (listEntry.name == 'Today' || listEntry.name == 'Week') {
			return false;
		}		
		return true;
    };
	
	$scope.addNewTodoItem = function(listEntry) {
  		console.log('Add a new todo item to list ' + listEntry.name + ' ...');	
		$state.go('app.todoitemcreate', {id: listEntry._id}, {});
	};
	
	$scope.showTodoItemDetails = function(todoItem) {
  		console.log('Show details of todo item ' + todoItem.title + ' with id ' + todoItem._id);	
		$state.go('app.todoitemdetail', {id: todoItem._id}, {});
	};
	
	$scope.showListDetails = function() {
		console.log('Show details of todo list ' + $scope.listEntry.name);	
		$scope.closeTodoListPopover();
		$state.go('app.listdetail', {id: $scope.listEntry._id}, {});
	};
	
	$scope.deleteTodoList = function() {
		$scope.closeTodoListPopover();
		
		var confirmPopup = $ionicPopup.confirm({
			title: 'Confirm Delete',
			template: 'All included Todo items will be deleted'
		});

		confirmPopup.then(function (res) {
			if (res) {
				// Delete Todo list
				console.log('Delete Todo list', $scope.listEntry._id);
				listFactory.delete({id: $scope.listEntry._id});
				
				$state.go('app.home', {}, {reload: true});

			} else {
				console.log('Canceled delete');
			}
		});	
	} 
	
	// Toggles the done attribute of a Todo item.
	$scope.toggleDone = function(todoItem) {
		console.log('toggleDone for item ' + todoItem.title + ', done = ' + todoItem.done);	
		if (todoItem.done == true) {
			var now = new Date();
			todoItem.doneAt = now;
		} 
		todoItemsFactory.update({id: todoItem._id}, todoItem,
			function(response) {
				console.log("Saved todo item after toggle with data: " + JSON.stringify(response));
			}, 
			function(response) {
				console.log("Error saving todo item: " + response.status + " " + response.statusText);
			}				 
		);
	};
	
	// Toggles whether done Todo items are shown or not.
	$scope.toggleShowDoneItems = function() {
		$scope.showDoneItems = !$scope.showDoneItems;
		console.log('Toggle showDoneItems. Value is: ' + $scope.showDoneItems);	
		if ($scope.showDoneItems) {
			$scope.buttonTitle = 'Hide done items';
		} else {
			$scope.buttonTitle = 'Show done items';
		}
	};
	
	$scope.shouldShowListDoneItems = function() {
		return $scope.showDoneItems
	}
	
	$scope.isVirtualList = function() {
        return $scope.listEntry.virtual == true;
    };
	
	// Flag for controlling visibility of the Delete Button in the Todo list. 
	$scope.shouldShowDelete = false;
	
	$scope.toggleDelete = function () {
		$scope.shouldShowDelete = !$scope.shouldShowDelete;		
	}

	// Deletes the given Todo item. Called from the Todoitems list from a Todo list.
	$scope.deleteTodoItem = function(todoItem) {
		var confirmPopup = $ionicPopup.confirm({
			title: 'Confirm Delete',
			template: 'Are you sure you want to delete this item?'
		});

		confirmPopup.then(function (res) {
			if (res) {
				console.log('Delete item ' + todoItem.title);	
				
				todoItemsFactory.delete({id: todoItem._id});
				$state.go('app.listtodoitems', {id: $scope.listEntry._id}, {reload: true});

			} else {
				console.log('Canceled delete');
			}
		});

		$scope.shouldShowDelete = false;	
	};
	
	// TodoItem Detail Options Popover
	$ionicPopover.fromTemplateUrl('templates/todolist-detail-popover.html', {
		scope: $scope
	}).then(function(popover) {
		$scope.todoListDetailPopover = popover;
	});
	
	// Open the Todo List entry Detail Popover
	$scope.openTodoListPopover = function($event) {
		$scope.todoListDetailPopover.show($event);
	};   

	// Close the Todo List entry Detail Popover
	$scope.closeTodoListPopover = function() {
		$scope.todoListDetailPopover.hide();
	};
}])

// Controller for detail page of a specific Todo Item entry
.controller('ToDoItemDetailController', ['$scope', '$state', '$stateParams', '$ionicPopup', '$ionicPopover', 'todoItemsFactory', 'listFactory', function ($scope, $state, $stateParams, $ionicPopup, $ionicPopover, todoItemsFactory, listFactory) {

	$scope.todoItem = {};
    $scope.showTodoItem = false;
    $scope.message = "Loading ...";
	
	$scope.parentTodoList = {};
	
	$scope.isNew = function () {
        return false;
    };
	
	$scope.localData = {
		dueDate: null
	};
	
	// Load Todo Item and the parent Todo list of this item
    $scope.todoItem = todoItemsFactory.get({
            id: $stateParams.id
        })
        .$promise.then(
            function (response) {
                $scope.todoItem = response;
				$scope.showTodoItem = true;
				
				if ($scope.todoItem.dueDate != null) {
					$scope.localData.dueDate = new Date($scope.todoItem.dueDate);
				} else {
					$scope.localData.dueDate = null;
				}
				
				// Get parent Todo list for Todo item
				$scope.parentTodoList = listFactory.get({
					id: $scope.todoItem.toDolist
				})
				.$promise.then(
					function (response) {
						$scope.parentTodoList = response;						
					},
					function (response) {
						$scope.message = "Error reading parent Todo list: " + response.status + " " + response.statusText;
					}
				); 				
            },
            function (response) {
                $scope.message = "Error reading todo item: " + response.status + " " + response.statusText;
            }
        );  
	
	// Save Todo Item data. Returns back on the list of all Todo items.
	$scope.submitTodoItemDetail = function () {
		console.log('Save data. dueDate = ', $scope.localData.dueDate);
		$scope.todoItem.dueDate = $scope.localData.dueDate;
  		todoItemsFactory.update({id: $stateParams.id}, $scope.todoItem,
			function(response) {
				console.log("Saved todo item with data: " + JSON.stringify(response));				
			
				var listId = $scope.todoItem.toDolist
				$state.go('app.listtodoitems', {id: listId}, {reload: true});
			}, 
			function(response) {
				console.log("Error saving todo item: " + response.status + " " + response.statusText);
			}				 
		);
    };
	
	$scope.cancelTodoItemDetail = function () {
		var listId = $scope.todoItem.toDolist
		$state.go('app.listtodoitems', {id: listId}, {reload: true});	
	}
	
	// TodoItem Detail Options Popover
	$ionicPopover.fromTemplateUrl('templates/todoitem-detail-popover.html', {
		scope: $scope
	}).then(function(popover) {
		$scope.todoItemDetailPopover = popover;
	});    

	// Open the TodoItem Detail Popover
	$scope.openTodoItemPopover = function($event) {
		$scope.todoItemDetailPopover.show($event);
	};   

	// Close the TodoItem Detail Popover
	$scope.closeTodoItemhPopover = function() {
		$scope.todoItemDetailPopover.hide();
	};
	
	// Deletes the current Todo item. Returns back on the parent list of this item
	$scope.deleteTodoItem = function() {
		$scope.closeTodoItemhPopover();
		
		var confirmPopup = $ionicPopup.confirm({
			title: 'Confirm Delete',
			template: 'Are you sure you want to delete this item?'
		});

		confirmPopup.then(function (res) {
			if (res) {
				console.log('Delete item ' + $scope.todoItem.title);	
				
				todoItemsFactory.delete({id: $scope.todoItem._id});
				$state.go('app.listtodoitems', {id: $scope.parentTodoList._id}, {reload: true});

			} else {
				console.log('Canceled delete');
			}
		});

		$scope.shouldShowDelete = false;	
	};
	
	$scope.dueDateChanged = function () {
		console.log("Due Date changed: " + $scope.dueDate);	
	}
}])

// Controller for creating a new Todo Item entry
.controller('ToDoItemCreationController', ['$scope', '$state', '$stateParams', 'todoItemsFactory', 'listFactory', function ($scope, $state, $stateParams, todoItemsFactory, listFactory) {
	
	var listId = $stateParams.id
	console.log("Creating new item for list " + listId);
	
	$scope.todoItem = {
		title: "",
		note: "",
		done: false,
		doneAt: null,
		dueDate: null,
		toDolist: listId
	};
	
	$scope.localData = {
		dueDate: null
	};
	
	$scope.parentTodoList = {};
	
	$scope.isNew = function () {
        return true;
    };
	
	// Get parent Todo list for Todo item
	$scope.parentTodoList = listFactory.get({
		id: $scope.todoItem.toDolist
	})
	.$promise.then(
		function (response) {
			$scope.parentTodoList = response;						
		},
		function (response) {
			$scope.message = "Error reading parent Todo list: " + response.status + " " + response.statusText;
		}
	); 	
	
	// Save Todo Item data. Returns back on the list of all Todo items.
	$scope.submitTodoItemDetail = function () {
		console.log('Save data. dueDate = ', $scope.localData.dueDate);
		$scope.todoItem.dueDate = $scope.localData.dueDate;
  		todoItemsFactory.save($scope.todoItem,
			function(response) {
				console.log("Saved todo item with data: " + JSON.stringify(response));	
				// Reset Todo item
				$scope.todoItem = {
					title: "",
					note: "",
					done: false,
					doneAt: null,
					dueDate: null,
					toDolist: listId
				};
				$scope.localData.dueDate = null;
				$state.go('app.listtodoitems', {id: listId}, {reload: true});	
			}, 
			function(response) {
				console.log("Error saving todo item: " + response.status + " " + response.statusText);
			}				 
		);
    };
	
	$scope.cancelTodoItemDetail = function () {
		var listId = $scope.todoItem.toDolist
		$state.go('app.listtodoitems', {id: listId}, {});	
	}
	
	$scope.dueDateChanged = function () {
		console.log("Due Date changed: " + $scope.dueDate);	
	}
		
}])

;
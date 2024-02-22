var todoApp = (function () {
            'use strict';

    var dbPromise = idb.open('ToDo', 1, function (upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('tasks')) {
        var tasksStore = upgradeDb.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
        tasksStore.createIndex('title', 'title', { unique: true });
    }
});

            console.log('App initialized');

           
            setInterval(checkForNotifications, 60000);

            function getMonthName(month) {
                var monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];
                return monthNames[month - 1];
            }

            function checkForNotifications() {
                var now = new Date();
                var currentHour = now.getHours();
                var currentMinute = now.getMinutes();

                dbPromise.then(function (db) {
                    var tx = db.transaction('tasks', 'readonly');
                    var store = tx.objectStore('tasks');
                    return store.getAll();
                }).then(function (tasks) {
                    tasks.forEach(function (task) {
                        // console.log('ho is ',currentHour);
                        // console.log('ho is ',task.hours);
                        // console.log("min is", currentMinute)
                        // console.log("min is", task.mins)
                        if (
                            task.hours == currentHour &&
                            task.mins == currentMinute &&
                            task.day == now.getDate() &&
                            task.month == now.getMonth() + 1 &&
                            task.year == now.getFullYear()
                        ) {
                            showNotification(task);
                        }
                    });
                });
            }

    function showNotification(task) {
    var formattedDate = getMonthName(task.month) + ' ' + task.day + ', ' + task.year;

    var notificationOptions = {
        body: 'Task: ' + task.title + ' at ' + task.hours + ':' + task.mins + ', ' + formattedDate,
    };

    var notification = new Notification('Time for your task', notificationOptions);

    var taskList = document.getElementById('tasks');
    var taskElements = taskList.getElementsByTagName('li');

    for (var i = 0; i < taskElements.length; i++) {
        var listItem = taskElements[i];
        var listItemText = listItem.textContent;

        if (listItemText.includes(task.title) &&
            listItemText.includes(task.hours + ':' + task.mins) &&
            listItemText.includes(formattedDate)) {
            listItem.classList.add('done');
            break;
        }
    }
}


   function addTask() {
    var title = document.getElementById('title').value;
    var hours = document.getElementById('hours').value;
    var mins = document.getElementById('Mins').value;
    var day = document.getElementById('day').value;
    var month = document.getElementById('month').value;
    var year = document.getElementById('year').value;

    
    var currentTime = new Date();
    var timestamp = currentTime.getTime(); 
    
    dbPromise.then(function (db) {
        var tx = db.transaction('tasks', 'readonly');
        var store = tx.objectStore('tasks');
        var index = store.index('title');
        return index.get(title);
    }).then(function (existingTask) {
        if (existingTask) {
            alert('Task with the same title already exists');
        } else {
            var task = {
                title: title,
                hours: hours,
                mins: mins,
                day: day,
                month: month,
                year: year,
                timestamp: timestamp
            };

            dbPromise.then(function (db) {
                var tx = db.transaction('tasks', 'readwrite');
                var store = tx.objectStore('tasks');
                return store.add(task);
            }).then(function () {
                console.log('Task added successfully');
                clearInputFields();
                displayTasks();
                enableNotificationButton();
                console.log('Task timestamp:', timestamp);
            }).catch(function (error) {
                console.error('Error adding task:', error);
            });
        }
    }).catch(function (error) {
        console.error('Error checking for existing task:', error);
    });
}


            function enableNotificationButton() {
                var notificationDiv = document.getElementById('notification');
                if (notificationDiv.childElementCount === 0) {
                    var enableNotificationButton = document.createElement('button');
                    enableNotificationButton.className ="enablebutton btn btn-light"
                    enableNotificationButton.textContent = 'Enable Notifications';
                    enableNotificationButton.addEventListener('click', function () {
                        requestNotificationPermission();
                    });

                    notificationDiv.appendChild(enableNotificationButton);
                }
            }

            function requestNotificationPermission() {
                if (Notification.permission !== 'granted') {
                    Notification.requestPermission().then(function (permission) {
                        if (permission === 'granted') {
                            showNotification();
                        }
                    });
                } else {
                    showNotification();
                }
            }

            function displayTasks() {
                console.log('Database initialized');

                var taskList = document.getElementById('tasks');

                dbPromise.then(function (db) {
                    var tx = db.transaction('tasks', 'readonly');
                    var store = tx.objectStore('tasks');

                    return store.getAll();
                }).then(function (tasks) {
                    taskList.innerHTML = '';

                    tasks.forEach(function (task) {
                        var listItem = document.createElement('li');

                        var formattedDate = getMonthName(task.month) + ' ' + task.day + ', ' + task.year;

                        listItem.textContent = task.title + ' - ' + task.hours + ':' + task.mins + ', ' + formattedDate;

                        var deleteButton = document.createElement('button');
                        deleteButton.className = 'delete-button';
                        deleteButton.textContent = 'Delete';
                        deleteButton.addEventListener('click', function () {
                            deleteTask(task.id);
                        });

                        listItem.appendChild(deleteButton);
                        taskList.appendChild(listItem);
                    });
                    console.log('All entries displayed');
                });
            }

            function deleteTask(taskId) {
                dbPromise.then(function (db) {
                    var tx = db.transaction('tasks', 'readwrite');
                    var store = tx.objectStore('tasks');
                    return store.delete(taskId);
                }).then(function () {
                    console.log('Task deleted successfully');
                    displayTasks();
                }).catch(function (error) {
                    console.error('Error deleting task:', error);
                });
            }

            function clearInputFields() {
                document.getElementById('title').value = '';
                document.getElementById('hours').value = '';
                document.getElementById('Mins').value = '';
                document.getElementById('day').value = '';
                document.getElementById('month').value = '';
                document.getElementById('year').value = '';
            }

            return {
                addTask: addTask,
                displayTasks: displayTasks
            };
        })();
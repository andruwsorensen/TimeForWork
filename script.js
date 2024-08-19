document.addEventListener('DOMContentLoaded', () => {
    const settingsIcon = document.getElementById('settings-icon');
    const settingsPopup = document.getElementById('settings-popup');
    const saveSettingsButton = document.getElementById('save-settings');

    const formatTime = (seconds, showHours = false) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        if (showHours) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        } else {
            return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        }
    };

    const parseTime = (timeString, showHours = false) => {
        const parts = timeString.split(':');
        let seconds = 0;
        if (showHours && parts.length === 3) {
            seconds += parseInt(parts[0], 10) * 3600;
            seconds += parseInt(parts[1], 10) * 60;
            seconds += parseInt(parts[2], 10);
        } else if (parts.length === 2) {
            seconds += parseInt(parts[0], 10) * 60;
            seconds += parseInt(parts[1], 10);
        }
        return seconds;
    };

    const createTimer = (displayElement, startButton, pauseButton, resetButton, initialTime, showHours = false, onEndCallback = null) => {
        let timeRemaining = initialTime;
        let intervalId = null;

        const updateDisplay = () => {
            displayElement.textContent = formatTime(timeRemaining, showHours);
        };

        const startTimer = () => {
            if (!intervalId) {
                intervalId = setInterval(() => {
                    if (timeRemaining > 0) {
                        timeRemaining--;
                        updateDisplay();
                    } else {
                        clearInterval(intervalId);
                        intervalId = null;
                        if (onEndCallback) {
                            onEndCallback();
                        }
                    }
                }, 1000);
            }
        };

        const pauseTimer = () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        const resetTimer = () => {
            pauseTimer();
            timeRemaining = initialTime;
            updateDisplay();
        };

        startButton.addEventListener('click', startTimer);
        pauseButton.addEventListener('click', pauseTimer);
        resetButton.addEventListener('click', resetTimer);

        displayElement.addEventListener('click', () => {
            displayElement.contentEditable = true;
            displayElement.focus();
        });

        displayElement.addEventListener('blur', () => {
            const newTime = parseTime(displayElement.textContent, showHours);
            if (newTime >= 0) {
                timeRemaining = newTime;
                initialTime = newTime;
            }
            displayElement.contentEditable = false;
            updateDisplay();
        });

        displayElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                displayElement.blur();
            }
        });

        updateDisplay();
    };

    createTimer(
        document.getElementById('workday-display'),
        document.getElementById('workday-start'),
        document.getElementById('workday-pause'),
        document.getElementById('workday-reset'),
        8 * 60 * 60,
        true
    );

    let isBreak = false;

    const focusTimer = () => {
        const initialTime = isBreak ? 17 * 60 : 52 * 60;
        const timerLabel = isBreak ? 'Break' : 'Work';

        createTimer(
            document.getElementById('focus-display'),
            document.getElementById('focus-start'),
            document.getElementById('focus-pause'),
            document.getElementById('focus-reset'),
            initialTime,
            false,
            () => {
                isBreak = !isBreak;
                alert(`${timerLabel} time is over!`);
                focusTimer();
            }
        );
    };

    focusTimer();

    // Event listener for toggling the settings popup
    settingsIcon.addEventListener('click', () => {
        settingsPopup.classList.toggle('hidden');
    });

    // Event listener for saving settings
    saveSettingsButton.addEventListener('click', () => {
        const workdayHours = parseInt(document.getElementById('default-workday-hours').value, 10) || 0;
        const workdayMinutes = parseInt(document.getElementById('default-workday-minutes').value, 10) || 0;
        const focusMinutes = parseInt(document.getElementById('default-focus-minutes').value, 10) || 0;
        const focusBreakMinutes = parseInt(document.getElementById('default-focus-break-minutes').value, 10) || 0;

        const workdayTime = (workdayHours * 3600) + (workdayMinutes * 60);
        const focusTime = focusMinutes * 60;
        const breakTime = focusBreakMinutes * 60;

        createTimer(
            document.getElementById('workday-display'),
            document.getElementById('workday-start'),
            document.getElementById('workday-pause'),
            document.getElementById('workday-reset'),
            workdayTime,
            true
        );

        focusTimer();
        settingsPopup.classList.add('hidden');
    });

    // Task Management Logic with Reordering and Completed Task Movement
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const tabList = document.getElementById('tab-list');
    const addTabButton = document.getElementById('add-tab');
    const tabs = document.querySelectorAll('.tab-button');


    // Task tabs logic
    // tabs.forEach(tab => {
    //     tab.addEventListener('click', function() {
    //       document.querySelector('.tab-button.active').classList.remove('active');
    //       this.classList.add('active');
    //       filterTasks(this.getAttribute('data-category'));
    //     });
    //   });

    function filterTasks(category) {
        console.log('this happened');
        const tasks = document.querySelectorAll('.task-items')
        tasks.forEach(task => {
            if (task.getAttribute('data-category') === category) {
                task.classList.remove('hidden')
            } else {
                task.classList.add('hidden')
            }
        })
    }

    addTabToDOM = (tabText, category) => {
        const tab = document.createElement('button');
        tab.className = 'tab-button';
        tab.setAttribute('data-category', category);
        tab.textContent = tabText;

        tabList.insertBefore(tab, tabList.firstChild);

        tab.addEventListener('click', () => {
            document.querySelector('.tab-button.active').classList.remove('active');
            tab.classList.add('active');
            filterTasks(tab.getAttribute('data-category')); 
        })
    }

    const loadTabs = () => {
        const tabs = JSON.parse(localStorage.getItem('tabs')) || [];
        tabs.forEach(tab => addTabToDOM(tab.text, tab.category));
        tabList.querySelector(':first-child').classList.add('active');    
    };

    const saveTabs = () => {
        const tabs = [];
        tabList.querySelectorAll('.tab-button').forEach(tab => {
            tabs.push({
                text: tab.textContent,
                category: tab.getAttribute('data-category')
            });
        });
        localStorage.setItem('tabs', JSON.stringify(tabs));
    };

    addTabButton.addEventListener('click', function() {
        const tabText = prompt('Enter new category name:');
        if (tabText) {
            const category = tabText.replace(/ /g, '').toLowerCase();
            addTabToDOM(tabText, category);
            saveTabs();
        }
    })

    const loadTasks = () => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => addTaskToDOM(task.text, task.completed, task.category));
    };

    const saveTasks = () => {
        const tasks = [];
        taskList.querySelectorAll('li').forEach(li => {
            tasks.push({
                text: li.querySelector('.task-text').textContent,
                completed: li.classList.contains('completed'),
                category: li.getAttribute('data-category')
            });
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    const addTaskToDOM = (taskText, completed = false, category) => {
        const li = document.createElement('li');
        li.draggable = true;
        li.className = 'task-items';
        li.setAttribute('data-category', category);

        if (completed) {
            li.classList.add('completed');
        }

        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = taskText;
        li.appendChild(span);

        const completeButton = document.createElement('button');
        completeButton.className = 'complete-btn';
        completeButton.innerHTML = '<i class="fas fa-check"></i>';
        li.appendChild(completeButton);

        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        li.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
        li.appendChild(deleteButton);

        if (completed) {
            taskList.appendChild(li);
        } else {
            taskList.insertBefore(li, taskList.firstChild);
        }

        completeButton.addEventListener('click', () => {
            li.classList.toggle('completed');
            moveCompletedTaskToBottom(li);
            saveTasks();
        });

        span.addEventListener('click', () => {
            span.contentEditable = true;
            span.focus();
        });

        span.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                span.contentEditable = false;
                saveTasks();
            }
        });

        editButton.addEventListener('click', () => {
            span.contentEditable = true;
            span.focus();
        });

        deleteButton.addEventListener('click', () => {
            li.remove();
            saveTasks();
        });

        // Drag and Drop logic
        li.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', li.outerHTML);
            li.classList.add('dragging');
        });

        li.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingElement = taskList.querySelector('.dragging');
            const currentElement = li;
            if (draggingElement && draggingElement !== currentElement) {
                const bounding = currentElement.getBoundingClientRect();
                const offset = bounding.y + (bounding.height / 2);
                if (e.clientY - offset > 0) {
                    taskList.insertBefore(draggingElement, currentElement.nextSibling);
                } else {
                    taskList.insertBefore(draggingElement, currentElement);
                }
            }
        });

        li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
            saveTasks();
        });
    };

    const moveCompletedTaskToBottom = (taskElement) => {
        if (taskElement.classList.contains('completed')) {
            taskList.appendChild(taskElement);
        } else {
            taskList.insertBefore(taskElement, taskList.firstChild);
        }
    };

    loadTabs();
    loadTasks();
    filterTasks(document.querySelector('.tab-button.active').getAttribute('data-category'));

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = taskInput.value.trim();
        const category = document.querySelector('.tab-button.active').getAttribute('data-category');
        if (taskText) {
            addTaskToDOM(taskText, false, category);
            saveTasks();
            taskInput.value = '';
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const settingsIcon = document.getElementById('settings-icon');
    const settingsPopup = document.getElementById('settings-popup');
    const saveSettingsButton = document.getElementById('save-settings');
    let sound = document.getElementById('mySound');
    let soundOn = document.getElementById('sound-switch');
    let workdayHours = 8;
    let workdayMinutes = 0;
    let focusTime = 52;
    let breakTime = 17;
    let isBreak = false;

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

    const createTimer = (displayElement, startButton, pauseButton, resetButton, initialTime, showHours = false, skipButton = null, hasEndCallback = false) => {
        let timeRemaining = initialTime;
        let intervalId = null;
        let startTime = null; // This will hold the time when the timer started
        let originalInitialTime = initialTime; // Store the original initial time
        let isPaused = true;
        
    
        const updateDisplay = () => {
            displayElement.textContent = formatTime(timeRemaining, showHours);
        };
    
        const tick = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000); // Calculate elapsed time in seconds
            timeRemaining = Math.max(originalInitialTime - elapsed, 0);
            updateDisplay();
    
            if (timeRemaining === 0) {
                clearInterval(intervalId);
                intervalId = null;
                isPaused = true;
                if (soundOn.checked) {
                    sound.play();
                }
                if (hasEndCallback) {
                    onEndCallback();
                }
            }
        };
    
        const startTimer = () => {
            if (!intervalId) {
                isPaused = false;
                startTime = Date.now() - (originalInitialTime - timeRemaining) * 1000; // Adjust start time based on remaining time
                intervalId = setInterval(tick, 1000);
            }
        };
    
        const pauseTimer = () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
                initialTime = timeRemaining; // Store the remaining time when paused
                isPaused = true;
            }
        };
    
        const resetTimer = () => {
            pauseTimer();
            initialTime = originalInitialTime; // Reset to the original initial time
            timeRemaining = initialTime;
            updateDisplay();
        };
    
        const skipTimer = () => {
            isBreak = !isBreak;
            originalInitialTime = isBreak ? breakTime * 60 : focusTime * 60;
            resetTimer();
        };
    
        startButton.addEventListener('click', startTimer);
        pauseButton.addEventListener('click', pauseTimer);
        resetButton.addEventListener('click', resetTimer);
        if (skipButton) {
            skipButton.addEventListener('click', skipTimer);
        }
    
        displayElement.addEventListener('click', () => {
            displayElement.contentEditable = true;
            displayElement.focus();
        });
    
        displayElement.addEventListener('blur', () => {
            const newTime = parseTime(displayElement.textContent, showHours);
            if (newTime >= 0) {
                timeRemaining = newTime;
                initialTime = newTime;
                startTime = Date.now(); // Adjust start time when manually changing the timer
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
    
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                if (!isPaused) {
                    tick(); // Recalculate the remaining time when the tab becomes visible again
                }
            }
        });
    
        updateDisplay();

        const onEndCallback = () => {
            setTimeout(() => {
                alert(`${isBreak ? 'Break' : 'Work'} time is over!`);
                isBreak = !isBreak; 
                originalInitialTime = isBreak ? breakTime * 60 : focusTime * 60;
                resetTimer();
            }, 500);
        }
    
        return {
            start: startTimer,
            pause: pauseTimer,
            reset: resetTimer,
            skip: skipTimer,
            updateInitialTime: (newInitialTime) => {
                initialTime = newInitialTime;
                originalInitialTime = newInitialTime; // Also update the original initial time
                resetTimer();  // Reset timer with the updated initial time
            }
        };
    };
    
    
    

    const workdayTimer = createTimer(
        document.getElementById('workday-display'),
        document.getElementById('workday-start'),
        document.getElementById('workday-pause'),
        document.getElementById('workday-reset'),
        workdayHours * 3600 + workdayMinutes * 60,
        true
    );

    let focusTimerInstance = null;

    const focusTimer = (focusTime, breakTime) => {
        if (focusTimerInstance) {
            focusTimerInstance.updateInitialTime(isBreak ? breakTime * 60 : focusTime * 60);
        } else {
            focusTimerInstance = createTimer(
                document.getElementById('focus-display'),
                document.getElementById('focus-start'),
                document.getElementById('focus-pause'),
                document.getElementById('focus-reset'),
                isBreak ? breakTime * 60 : focusTime * 60,
                false,
                document.getElementById('focus-skip'),
                true
            );
        }
    };

    focusTimer(focusTime, breakTime);


    // Event listener for toggling the settings popup
    settingsIcon.addEventListener('click', () => {
        settingsPopup.classList.toggle('hidden');
    });

    // Event listener for saving settings
    saveSettingsButton.addEventListener('click', () => {
        var inputs = document.querySelectorAll('.settings-section input')
        var allValid = true;

        inputs.forEach(function(input) {
            if (!input.checkValidity()) {
                allValid = false;
                input.reportValidity();  // Show browser's default error message
            }
        });

        if (!allValid) {
            event.preventDefault();
        } else {
            workdayHours = parseInt(document.getElementById('default-workday-hours').value)
            workdayMinutes = parseInt(document.getElementById('default-workday-minutes').value)

            focusTime = parseInt(document.getElementById('default-focus-minutes').value);
            breakTime = parseInt(document.getElementById('default-focus-break-minutes').value);

            workdayTimer.updateInitialTime(workdayHours * 3600 + workdayMinutes * 60);

            focusTimer(focusTime, breakTime);
            settingsPopup.classList.add('hidden');
        };
    });


    // * Task Management Logic with Reordering and Completed Task Movement

    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const tabList = document.getElementById('tab-list');
    const tabContainer = document.getElementById('tab-container');
    const addTabButton = document.getElementById('add-tab');
    const tabs = document.querySelectorAll('.tab-button');

    // Task tabs logic

    function filterTasks(category) {
        const tasks = document.querySelectorAll('.task-items')
        tasks.forEach(task => {
            if (task.getAttribute('data-category') === category) {
                task.classList.remove('hidden')
            } else {
                task.classList.add('hidden')
            }
        })
    }

    const addTabToDOM = (tabText, category) => {
        const tab = document.createElement('button');
        tab.className = 'tab-button';
        tab.setAttribute('data-category', category);
        tab.textContent = tabText;
        tab.draggable = true; // Make the tab draggable

        tabList.insertBefore(tab, tabList.firstChild);

        // Tab selection logic
        tab.addEventListener('click', () => {
            const activeTab = document.querySelector('.tab-button.active');
            if (activeTab) activeTab.classList.remove('active');
            tab.classList.add('active');
            filterTasks(tab.getAttribute('data-category'));
            updateActiveTabInContainer(tab);
            updateTaskFormState();
        });

        // Drag and Drop logic for tabs
        tab.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', tab.getAttribute('data-category'));
            tab.classList.add('dragging');
        });

        tab.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingTab = tabList.querySelector('.dragging');
            currentElement = tab;
            if (draggingTab && draggingTab !== currentElement) {
                const bounding = currentElement.getBoundingClientRect();
                const offset = bounding.x + (bounding.width / 2);
                if (e.clientX - offset > 0) {
                    tabList.insertBefore(draggingTab, currentElement.nextSibling);
                } else {
                    tabList.insertBefore(draggingTab, currentElement);
                }
            }
        });

        tab.addEventListener('dragend', () => {
            tab.classList.remove('dragging');
            const draggingTab = tabList.querySelector('.dragging');
            saveTabs();
        });
    };

    const updateActiveTabInContainer = (tab) => {
        // Clear current content in tabContainer
        tabContainer.innerHTML = '';

        const tabText = tab.textContent;
        const category = tab.getAttribute('data-category');

        const activeTabContainer = document.createElement('div');
        activeTabContainer.className = 'active-tab-container';

        const activeTab = document.createElement('span');
        activeTab.className = 'active-tab';
        activeTab.textContent = tabText;

        const editTabBtn = document.createElement('button');
        editTabBtn.className = 'edit-tab-btn';
        editTabBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';

        const deleteTabBtn = document.createElement('button');
        deleteTabBtn.className = 'delete-tab-btn';
        deleteTabBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';

        activeTabContainer.appendChild(activeTab);
        activeTabContainer.appendChild(editTabBtn);
        activeTabContainer.appendChild(deleteTabBtn);
        tabContainer.appendChild(activeTabContainer);

        // Tab editing logic
        editTabBtn.addEventListener('click', () => {
            const newTabText = prompt('Edit category name:', tabText);
            if (newTabText && newTabText !== tabText) {
                const newCategory = newTabText.replace(/ /g, '').toLowerCase();
                activeTab.textContent = newTabText;
                tab.textContent = newTabText;
                tab.setAttribute('data-category', newCategory);
                updateTasksCategory(category, newCategory);
                saveTabs();
                saveTasks();
            }
        });

        // Tab deletion logic
        deleteTabBtn.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete the tab "${tabText}"? All related tasks will be deleted.`)) {
                tab.remove();
                tabContainer.innerHTML = '';
                deleteTasksByCategory(category);
                saveTabs();
                saveTasks();
                updateTaskFormState();
            }
        });
    };

    const loadTabs = () => {
        const tabs = JSON.parse(localStorage.getItem('tabs')) || [];
        tabs.forEach(tab => addTabToDOM(tab.text, tab.category));
        const firstTab = tabList.querySelector('.tab-button');
        if (firstTab) {
            firstTab.classList.add('active');
            updateActiveTabInContainer(firstTab);
        }
    };

    const saveTabs = () => {
        const tabs = [];
        tabList.querySelectorAll('.tab-button').forEach(tab => {
            tabs.push({
                text: tab.textContent,
                category: tab.getAttribute('data-category')
            });
        });
        localStorage.setItem('tabs', JSON.stringify(tabs.reverse()));
    };

    addTabButton.addEventListener('click', function() {
        const tabText = prompt('Enter new category name:');
        if (tabText) {
            const category = tabText.replace(/ /g, '').toLowerCase();
            addTabToDOM(tabText, category);
            saveTabs();
        }
    });

    const updateTasksCategory = (oldCategory, newCategory) => {
        document.querySelectorAll(`.task-items[data-category="${oldCategory}"]`).forEach(task => {
            task.setAttribute('data-category', newCategory);
        });
    };

    const deleteTasksByCategory = (category) => {
        document.querySelectorAll(`.task-items[data-category="${category}"]`).forEach(task => {
            task.remove();
        });
    };

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
        localStorage.setItem('tasks', JSON.stringify(tasks.reverse()));
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

    const updateTaskFormState = () => {
        const taskForm = document.getElementById('task-form');
        const taskInput = document.getElementById('task-input');
        const addTaskButton = taskForm.querySelector('button[type="submit"]');
        if (document.querySelectorAll('.tab-button').length === 0) {
            taskInput.disabled = true;
            addTaskButton.disabled = true;
        } else {
            taskInput.disabled = false;
            addTaskButton.disabled = false;
        }
    };

    loadTabs();
    loadTasks();
    updateTaskFormState();
    filterTasks(document.querySelector('.tab-button.active')?.getAttribute('data-category'));

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

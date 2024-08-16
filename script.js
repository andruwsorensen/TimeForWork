document.addEventListener('DOMContentLoaded', () => {
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

    const start52_17Timer = () => {
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
                start52_17Timer();
            }
        );
    };

    start52_17Timer();

    // Task Management Logic with Reordering and Completed Task Movement
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');

    const loadTasks = () => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => addTaskToDOM(task.text, task.completed));
    };

    const saveTasks = () => {
        const tasks = [];
        taskList.querySelectorAll('li').forEach(li => {
            tasks.push({
                text: li.querySelector('.task-text').textContent,
                completed: li.classList.contains('completed')
            });
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    const addTaskToDOM = (taskText, completed = false) => {
        const li = document.createElement('li');
        li.draggable = true;

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

        // Insert the new task at the top of the task list if it's incomplete
        // Otherwise, add it to the bottom if it's completed
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

    loadTasks();

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = taskInput.value.trim();
        if (taskText) {
            addTaskToDOM(taskText);
            saveTasks();
            taskInput.value = '';
        }
    });
});

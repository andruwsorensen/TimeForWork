document.addEventListener('DOMContentLoaded', () => {
    // Utility function to format time (hh:mm:ss)
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

    // Timer function
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

        // Initialize the display
        updateDisplay();
    };

    // Workday Timer (8 hours) - Display in hh:mm:ss format
    createTimer(
        document.getElementById('workday-display'),
        document.getElementById('workday-start'),
        document.getElementById('workday-pause'),
        document.getElementById('workday-reset'),
        8 * 60 * 60,  // 8 hours
        true           // Show hours
    );

    // 52/17 Timer (52 minutes work / 17 minutes break)
    const focusElement = document.getElementById('focus-display');
    let isBreak = false;

    const start52_17Timer = () => {
        const initialTime = isBreak ? 17 * 60 : 52 * 60;
        const timerLabel = isBreak ? 'Break' : 'Work';

        createTimer(
            focusElement,
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

        focusElement.textContent = formatTime(initialTime);
    };

    start52_17Timer();  // Initialize the 52/17 timer

    // Task Management Logic
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

        taskList.appendChild(li);

        // Handle task completion
        completeButton.addEventListener('click', () => {
            li.classList.toggle('completed');
            saveTasks();
        });

        // Handle inline editing
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

        // Handle edit button functionality (as a fallback if needed)
        editButton.addEventListener('click', () => {
            span.contentEditable = true;
            span.focus();
        });

        // Handle delete functionality
        deleteButton.addEventListener('click', () => {
            li.remove();
            saveTasks();
        });
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

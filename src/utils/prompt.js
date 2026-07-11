const inquirer = require('inquirer');

let escPressed = false;

process.stdin.on('keypress', (str, key) => {
  if (key && key.name === 'escape') {
    escPressed = true;
    // Force close the active readline so inquirer rejects the current prompt
    process.stdin.emit('end');
  }
});

async function prompt(questions) {
  try {
    const answers = await inquirer.prompt(questions);
    return answers;
  } catch (e) {
    if (escPressed) {
      escPressed = false;
      process.stdin.resume();
      // Special sentinel the caller checks as "user hit ESC"
      return { __esc: true };
    }
    throw e;
  }
}

module.exports = { prompt };

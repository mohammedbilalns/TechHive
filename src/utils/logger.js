const reset = "[0m";

// Foreground colors
const fg = {
  white: "[37m",
  black: "[30m",
  green: "[32m",
  red: "[31m",
  yellow: "[33m",
  blue: "[34m",
};

// Background colors
const bg = {
  green: "[42m",
  red: "[41m",
  yellow: "[43m",
  blue: "[44m",
};

const logger = {
  info: (topic, ...args) => {
    if (args.length > 0) {
      console.log(`${bg.green}${fg.black} ${topic} ${reset}:`, ...args);
    } else {
      console.log(`${fg.green}${topic}${reset}`);
    }
  },
  error: (topic, ...args) => {
    if (args.length > 0) {
      console.error(`${bg.red}${fg.white} ${topic} ${reset}:`, ...args);
    } else {
      console.error(`${fg.red}${topic}${reset}`);
    }
  },
  warn: (topic, ...args) => {
    if (args.length > 0) {
      console.warn(`${bg.yellow}${fg.black} ${topic} ${reset}:`, ...args);
    } else {
      console.warn(`${fg.yellow}${topic}${reset}`);
    }
  },
  debug: (topic, ...args) => {
    if (args.length > 0) {
      console.log(`${bg.blue}${fg.white} ${topic} ${reset}:`, ...args);
    } else {
      console.log(`${fg.blue}${topic}${reset}`);
    }
  },
};

export default logger;
